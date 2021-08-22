import { BaseGuildCommand } from '@cluster/command';
import { GuildCommandContext } from '@cluster/types';
import { CommandType, humanize } from '@cluster/utils';
import { guard, pluralise as p } from '@core/utils';
import { Constants, DiscordAPIError, GuildTextBasedChannels } from 'discord.js';

export class ModlogCommand extends BaseGuildCommand {
    public constructor() {
        super({
            name: 'modlog',
            category: CommandType.ADMIN,
            definitions: [
                {
                    parameters: '{channel:channel+?}',
                    description: 'Sets the channel to use as the modlog channel',
                    execute: (ctx, [channel]) => this.setChannel(ctx, channel ?? ctx.channel)
                },
                {
                    parameters: 'disable',
                    description: 'Disables the modlog',
                    execute: ctx => this.setChannel(ctx, undefined)
                },
                {
                    parameters: 'clear|delete {ids:integer[0]}',
                    description: 'Deletes specific modlog entries. If you dont provide any, all the entries will be removed',
                    execute: (ctx, [count]) => this.clearModlog(ctx, count ?? Infinity)
                }
            ]
        });
    }

    public async setChannel(context: GuildCommandContext, channel: GuildTextBasedChannels | undefined): Promise<string> {
        await context.database.guilds.setSetting(context.channel.guild.id, 'modlog', channel?.id);

        if (channel === undefined)
            return this.success('The modlog is disabled');
        return this.success(`Modlog entries will now be sent in ${channel.toString()}`);
    }

    public async clearModlog(context: GuildCommandContext, ids: number[]): Promise<string> {
        const modlogs = await context.database.guilds.removeModlogCases(context.channel.guild.id, ids.length === 0 ? undefined : ids);

        if (modlogs === undefined || modlogs.length === 0)
            return this.error('No modlogs were found!');

        const modlogChanel = await context.database.guilds.getSetting(context.channel.guild.id, 'modlog');
        const missingChannel: number[] = [];
        const missingMessage: number[] = [];
        const noperms: number[] = [];
        const toDelete: Record<string, CaseMessageRef[]> = {};
        for (const modlog of modlogs) {
            if (modlog.msgid === undefined) {
                missingMessage.push(modlog.caseid);
                continue;
            }

            const channelId = modlog.channelid ?? modlogChanel;
            if (channelId === undefined) {
                missingChannel.push(modlog.caseid);
                continue;
            }
            (toDelete[channelId] ??= []).push({ msgid: modlog.msgid, caseid: modlog.caseid });
        }

        for (const [channelid, cases] of Object.entries(toDelete)) {
            const channel = await context.util.getChannel(context.channel.guild, channelid);
            if (channel === undefined || !guard.isTextableChannel(channel)) {
                missingChannel.push(...cases.map(c => c.caseid));
                continue;
            }

            try {
                const result = await channel.bulkDelete(cases.map(c => c.msgid));
                for (const entry of cases) {
                    if (!result.has(entry.msgid))
                        missingMessage.push(entry.caseid);

                }
            } catch (err: unknown) {
                if (err instanceof DiscordAPIError && err.code === Constants.APIErrors.MISSING_PERMISSIONS) {
                    noperms.push(...cases.map(c => c.caseid));
                    continue;
                }
                throw err;
            }
        }

        const errors = [
            missingChannel.length > 0 ? `I couldnt find the modlog channel for cases ${humanize.smartJoin(missingChannel.map(c => `\`${c}\``), ', ', ' and ')}` : undefined,
            missingMessage.length > 0 ? `I couldnt find the modlog message for cases ${humanize.smartJoin(missingMessage.map(c => `\`${c}\``), ', ', ' and ')}` : undefined,
            noperms.length > 0 ? `I didnt have permission to delete the modlog for cases ${humanize.smartJoin(noperms.map(c => `\`${c}\``), ', ', ' and ')}` : undefined
        ].filter(guard.hasValue);

        if (errors.length > 0)
            return this.warning(`I successfully deleted ${modlogs.length} ${p(modlogs.length, 'modlog')} from my database.`, ...errors);
        return this.success(`I successfully deleted ${modlogs.length} ${p(modlogs.length, 'modlog')} from my database.`);
    }
}

interface CaseMessageRef {
    readonly msgid: string;
    readonly caseid: number;
}
