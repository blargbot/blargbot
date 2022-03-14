import { BaseGuildCommand } from '@blargbot/cluster/command';
import { GuildCommandContext } from '@blargbot/cluster/types';
import { CommandType, humanize } from '@blargbot/cluster/utils';
import { guard, pluralise as p } from '@blargbot/core/utils';
import { ApiError, DiscordRESTError, KnownChannel } from 'eris';

export class ModlogCommand extends BaseGuildCommand {
    public constructor() {
        super({
            name: 'modlog',
            category: CommandType.ADMIN,
            definitions: [
                {
                    parameters: '{channel:channel+?}',
                    description: 'Sets the channel to use as the modlog channel',
                    execute: (ctx, [channel]) => this.setChannel(ctx, channel.asOptionalChannel ?? ctx.channel)
                },
                {
                    parameters: 'disable',
                    description: 'Disables the modlog',
                    execute: ctx => this.setChannel(ctx, undefined)
                },
                {
                    parameters: 'clear|delete {ids:integer[0]}',
                    description: 'Deletes specific modlog entries. If you dont provide any, all the entries will be removed',
                    execute: (ctx, [ids]) => this.clearModlog(ctx, ids.asIntegers)
                }
            ]
        });
    }

    public async setChannel(context: GuildCommandContext, channel: KnownChannel | undefined): Promise<string> {
        if (channel !== undefined && (!guard.isGuildChannel(channel) || channel.guild !== context.channel.guild))
            return this.error('The modlog channel must be on this server!');
        if (channel !== undefined && !guard.isTextableChannel(channel))
            return this.error('The modlog channel must be a text channel!');

        await context.database.guilds.setSetting(context.channel.guild.id, 'modlog', channel?.id);

        if (channel === undefined)
            return this.success('The modlog is disabled');
        return this.success(`Modlog entries will now be sent in ${channel.mention}`);
    }

    public async clearModlog(context: GuildCommandContext, ids: readonly number[]): Promise<string> {
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
                await channel.deleteMessages(cases.map(c => c.msgid));
            } catch (err: unknown) {
                if (err instanceof DiscordRESTError && err.code === ApiError.MISSING_PERMISSIONS) {
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
