import { CommandContext, GlobalCommand } from '@blargbot/cluster/command';
import { codeBlock, CommandType, guard, humanize, pluralise as p } from '@blargbot/cluster/utils';
import { SendPayload } from '@blargbot/core/types';
import { EmbedField, EmbedOptions } from 'eris';
import moment from 'moment-timezone';

export class TimersCommand extends GlobalCommand {
    public constructor() {
        super({
            name: `timers`,
            aliases: [`reminders`, `events`],
            category: CommandType.ADMIN,
            definitions: [
                {
                    parameters: `{page:integer=1}`,
                    description: `Lists all the currently active timers here`,
                    execute: (ctx, [page]) => this.listTimers(ctx, page.asInteger)
                },
                {
                    parameters: `info {timerId}`,
                    description: `Shows detailed information about a given timer`,
                    execute: (ctx, [timerId]) => this.getTimer(ctx, timerId.asString)
                },
                {
                    parameters: `cancel|delete {timerIds[]}`,
                    description: `Cancels currently active timers`,
                    execute: (ctx, [timerIds]) => this.cancelTimers(ctx, timerIds.asStrings)
                },
                {
                    parameters: `clear`,
                    description: `Clears all currently active timers`,
                    execute: (ctx) => this.clearAllTimers(ctx)
                }
            ]
        });
    }

    public async listTimers(context: CommandContext, page: number): Promise<string> {
        const pageSize = 15;
        const source = guard.isGuildCommandContext(context) ? context.channel.guild.id : context.author.id;
        const eventsPage = await context.database.events.list(source, page - 1, pageSize);
        if (eventsPage.total === 0)
            return this.success(`There are no active timers!`);

        const header = [`Id`, `Elapsed`, `Remain`, `User`, `Type`, `Content`] as const;
        const maxLength = header.map(s => s.length) as [number, number, number, number, number, number];
        const grid: Array<readonly [string, string, string, string, string, string]> = [];
        for (const event of eventsPage.events) {
            const userId = `user` in event ? event.user : undefined;
            const userObj = userId !== undefined ? context.discord.users.get(userId) : undefined;
            const user = userObj !== undefined ? humanize.fullName(userObj) : userId ?? ``;
            let content = `content` in event ? event.content : ``;
            if (content.length > 40)
                content = `${content.slice(0, 37)  }...`;

            const row = [
                simpleId(event.id),
                moment(event.starttime).fromNow(true),
                moment(event.endtime).fromNow(true),
                user,
                event.type,
                content
            ] as const;

            for (let i = 0; i < row.length; i++)
                maxLength[i] = Math.max(maxLength[i], row[i].length);
            grid.push(row);
        }
        const gridLines: string[] = [];
        const pushRow = (row: typeof grid[number]): unknown => gridLines.push(row.map((s, i) => s.padEnd(maxLength[i], ` `)).join(` | `));
        pushRow(header);
        gridLines.push(``.padEnd(gridLines[0].length, `-`));
        for (const row of grid)
            pushRow(row);

        const paging = eventsPage.total > eventsPage.events.length
            ? `Showing timers ${(page - 1) * pageSize + 1} - ${page * pageSize + 1} of ${eventsPage.total}. Page ${page}/${Math.ceil(eventsPage.total / pageSize)}`
            : ``;

        return this.info(`Here are the currently active timers:${codeBlock(gridLines.join(`\n`), `prolog`)}${paging}`);
    }

    public async getTimer(context: CommandContext, timerId: string): Promise<SendPayload> {
        const source = guard.isGuildCommandContext(context) ? context.channel.guild.id : context.author.id;
        const allTimerIds = await context.database.events.getIds(source);
        const idMatch = allTimerIds.find(t => t.startsWith(timerId));
        const timer = idMatch === undefined ? undefined : await context.database.events.get(idMatch);

        if (timer === undefined)
            return this.error(`I couldn't find the timer you gave.`);

        const embed: EmbedOptions = {};
        const fields = embed.fields = [] as EmbedField[];

        embed.title = `Timer #${simpleId(timer.id)}`;
        embed.description = `content` in timer ? timer.content.length > 2000 ? `${timer.content.slice(0, 1997)  }...` : timer.content : undefined;
        fields.push({
            name: `Type`,
            value: timer.type,
            inline: true
        });

        if (`user` in timer) {
            fields.push({
                name: `Started by`,
                value: `<@${timer.user}>`,
                inline: true
            });
        }

        fields.push({
            name: `Duration`,
            value: `Started <t:${moment(timer.starttime).unix()}>\nEnds <t:${moment(timer.endtime).unix()}>`,
            inline: false
        });

        return { embeds: [embed] };
    }

    public async cancelTimers(context: CommandContext, timerIds: readonly string[]): Promise<string> {
        const source = guard.isGuildCommandContext(context) ? context.channel.guild.id : context.author.id;
        const allTimerIds = await context.database.events.getIds(source);
        const matchIds = allTimerIds.filter(i => timerIds.some(j => i.startsWith(j)));

        const successes = [];
        const failures = [];
        for (const id of matchIds) {
            if (await context.cluster.timeouts.delete(id))
                successes.push(id);
            else
                failures.push(id);
        }

        if (successes.length === 0)
            return this.error(`I couldnt find ${p(timerIds.length, `the timer`, `any of the timers`)} you specified!`);

        const lines = [`Cancelled ${successes.length} ${p(successes.length, `timer`)}:`];
        for (const id of successes)
            lines.push(`\`${simpleId(id)}\``);
        if (failures.length > 0) {
            lines.push(`Could not find ${p(failures.length, `id`)}:`);
            for (const id of failures)
                lines.push(`\`${simpleId(id)}\``);
        }

        if (failures.length > 0)
            return this.warning(lines.join(`\n`));
        return this.success(lines.join(`\n`));
    }

    public async clearAllTimers(context: CommandContext): Promise<string> {
        const source = guard.isGuildCommandContext(context) ? context.channel.guild.id : context.author.id;
        const shouldClear = await context.util.queryConfirm({
            context: context.channel,
            actors: context.author,
            prompt: this.warning(`Are you sure you want to clear all timers?`),
            confirm: `Yes`,
            cancel: `No`,
            fallback: false
        });

        if (!shouldClear)
            return this.info(`Cancelled clearing of timers`);

        await context.cluster.timeouts.deleteAll(source);
        return this.success(`All timers cleared`);
    }
}

function simpleId(id: string): string {
    return id.slice(0, 5);
}
