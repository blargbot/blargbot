import type { CommandResult, GuildCommandContext } from '@blargbot/cluster/types.js';
import { CommandType } from '@blargbot/cluster/utils/index.js';
import { guard } from '@blargbot/core/utils/index.js';
import * as Eris from 'eris';

import { GuildCommand } from '../../command/index.js';
import templates from '../../text.js';

const cmd = templates.commands.modLog;

export class ModlogCommand extends GuildCommand {
    public constructor() {
        super({
            name: 'modlog',
            category: CommandType.ADMIN,
            definitions: [
                {
                    parameters: '{channel:channel+?}',
                    description: cmd.setChannel.description,
                    execute: (ctx, [channel]) => this.setChannel(ctx, channel.asOptionalChannel ?? ctx.channel)
                },
                {
                    parameters: 'disable',
                    description: cmd.disable.description,
                    execute: ctx => this.setChannel(ctx, undefined)
                },
                {
                    parameters: 'clear|delete {ids:integer[0]}',
                    description: cmd.clear.description,
                    execute: (ctx, [ids]) => this.clearModlog(ctx, ids.asIntegers)
                }
            ]
        });
    }

    public async setChannel(context: GuildCommandContext, channel: Eris.KnownChannel | undefined): Promise<CommandResult> {
        if (channel !== undefined && (!guard.isGuildChannel(channel) || channel.guild !== context.channel.guild))
            return cmd.setChannel.notOnGuild;
        if (channel !== undefined && !guard.isTextableChannel(channel))
            return cmd.setChannel.notTextChannel;

        await context.database.guilds.setSetting(context.channel.guild.id, 'modlog', channel?.id);

        return channel === undefined
            ? cmd.disable.success
            : cmd.setChannel.success({ channel });
    }

    public async clearModlog(context: GuildCommandContext, ids: readonly number[]): Promise<CommandResult> {
        const modlogs = await context.database.guilds.removeModlogCases(context.channel.guild.id, ids.length === 0 ? undefined : ids);

        if (modlogs === undefined || modlogs.length === 0)
            return cmd.clear.notFound;

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
                if (err instanceof Eris.DiscordRESTError && err.code === Eris.ApiError.MISSING_PERMISSIONS) {
                    noperms.push(...cases.map(c => c.caseid));
                    continue;
                }
                throw err;
            }
        }

        const errors = [];
        if (missingChannel.length > 0)
            errors.push(cmd.clear.channelMissing({ modlogs: missingChannel }));
        if (missingMessage.length > 0)
            errors.push(cmd.clear.messageMissing({ modlogs: missingMessage }));
        if (noperms.length > 0)
            errors.push(cmd.clear.permissionMissing({ modlogs: noperms }));

        return cmd.clear.success({ count: modlogs.length, errors });
    }
}

interface CaseMessageRef {
    readonly msgid: string;
    readonly caseid: number;
}
