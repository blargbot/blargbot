import { CommandContext, GlobalCommand } from '@blargbot/cluster/command';
import { CommandType, guard } from '@blargbot/cluster/utils';
import { format, IFormattable, literal } from '@blargbot/domain/messages/types';
import { EmbedField, EmbedOptions } from 'eris';
import moment from 'moment-timezone';

import templates from '../../text';
import { CommandResult } from '../../types';

const cmd = templates.commands.timers;

export class TimersCommand extends GlobalCommand {
    public constructor() {
        super({
            name: `timers`,
            aliases: [`reminders`, `events`],
            category: CommandType.ADMIN,
            definitions: [
                {
                    parameters: `{page:integer=1}`,
                    description: cmd.list.description,
                    execute: (ctx, [page]) => this.listTimers(ctx, page.asInteger)
                },
                {
                    parameters: `info {timerId}`,
                    description: cmd.info.description,
                    execute: (ctx, [timerId]) => this.getTimer(ctx, timerId.asString)
                },
                {
                    parameters: `cancel|delete {timerIds[]}`,
                    description: cmd.cancel.description,
                    execute: (ctx, [timerIds]) => this.cancelTimers(ctx, timerIds.asStrings)
                },
                {
                    parameters: `clear`,
                    description: cmd.clear.description,
                    execute: (ctx) => this.clearAllTimers(ctx)
                }
            ]
        });
    }

    public async listTimers(context: CommandContext, page: number): Promise<CommandResult> {
        const pageSize = 15;
        const source = guard.isGuildCommandContext(context) ? context.channel.guild.id : context.author.id;
        const eventsPage = await context.database.events.list(source, page - 1, pageSize);
        if (eventsPage.total === 0)
            return cmd.list.none;

        const columns = [
            cmd.list.table.id,
            cmd.list.table.elapsed,
            cmd.list.table.remain,
            cmd.list.table.user,
            cmd.list.table.type,
            cmd.list.table.content
        ] as const;

        const table: IFormattable<string> = {
            [format](formatter) {
                const headers = columns.map(c => c.header[format](formatter));
                const maxLength = headers.map(s => s.length);
                const grid: Array<readonly string[]> = [];
                for (const event of eventsPage.events) {
                    const userId = `user` in event ? event.user : undefined;
                    const user = userId !== undefined ? context.discord.users.get(userId) : undefined;
                    let content = `content` in event ? event.content : ``;
                    if (content.length > 40)
                        content = `${content.slice(0, 37)}...`;

                    const row = columns.map(c => c.cell({
                        id: event.id,
                        startTime: moment(event.starttime),
                        endTime: moment(event.endtime),
                        user,
                        type: event.type,
                        content
                    })[format](formatter));

                    for (let i = 0; i < row.length; i++)
                        maxLength[i] = Math.max(maxLength[i], row[i].length);
                    grid.push(row);
                }
                const gridLines: string[] = [];
                const pushRow = (row: typeof grid[number]): unknown => gridLines.push(row.map((s, i) => s.padEnd(maxLength[i], ` `)).join(` | `));
                pushRow(headers);
                gridLines.push(``.padEnd(gridLines[0].length, `-`));
                for (const row of grid)
                    pushRow(row);

                return gridLines.join(`\n`);
            }
        };

        const paging = eventsPage.total > eventsPage.events.length
            ? cmd.list.paged({
                start: (page - 1) * pageSize + 1,
                end: page * pageSize + 1,
                total: eventsPage.total,
                page,
                pageCount: Math.ceil(eventsPage.total / pageSize)
            })
            : undefined;

        return cmd.list.success({ table, paging });
    }

    public async getTimer(context: CommandContext, timerId: string): Promise<CommandResult> {
        const source = guard.isGuildCommandContext(context) ? context.channel.guild.id : context.author.id;
        const allTimerIds = await context.database.events.getIds(source);
        const idMatch = allTimerIds.find(t => t.startsWith(timerId));
        const timer = idMatch === undefined ? undefined : await context.database.events.get(idMatch);

        if (timer === undefined)
            return cmd.info.notFound;

        const embed: EmbedOptions = {};
        const fields = embed.fields = [] as EmbedField[];

        embed.title = `Timer #${simpleId(timer.id)}`;
        embed.description = `content` in timer ? timer.content.length > 2000 ? `${timer.content.slice(0, 1997)}...` : timer.content : undefined;
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

        return {
            embeds: [
                {
                    title: cmd.info.embed.title({ id: simpleId(timer.id) }),
                    description: literal(`content` in timer ? timer.content.length > 2000 ? `${timer.content.slice(0, 1997)}...` : timer.content : undefined),
                    fields: [
                        {
                            name: cmd.info.embed.field.type.name,
                            value: literal(timer.type),
                            inline: true
                        },
                        ... `user` in timer
                            ? [{
                                name: cmd.info.embed.field.user.name,
                                value: cmd.info.embed.field.user.value({ userId: timer.user }),
                                inline: true
                            }]
                            : [],
                        {
                            name: cmd.info.embed.field.duration.name,
                            value: cmd.info.embed.field.duration.value({ start: moment(timer.starttime), end: moment(timer.endtime) }),
                            inline: false
                        }
                    ]

                }
            ]
        };
    }

    public async cancelTimers(context: CommandContext, timerIds: readonly string[]): Promise<CommandResult> {
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
            return cmd.cancel.timersMissing({ count: timerIds.length });

        return failures.length === 0
            ? cmd.cancel.success.default({ success: successes.map(simpleId) })
            : cmd.cancel.success.partial({ success: successes.map(simpleId), fail: failures.map(simpleId) });
    }

    public async clearAllTimers(context: CommandContext): Promise<CommandResult> {
        const source = guard.isGuildCommandContext(context) ? context.channel.guild.id : context.author.id;
        const shouldClear = await context.queryConfirm({
            prompt: cmd.clear.confirm.prompt,
            continue: cmd.clear.confirm.continue,
            cancel: cmd.clear.confirm.cancel,
            fallback: false
        });

        if (!shouldClear)
            return cmd.clear.cancelled;

        await context.cluster.timeouts.deleteAll(source);
        return cmd.clear.success;
    }
}

function simpleId(id: string): string {
    return id.slice(0, 5);
}
