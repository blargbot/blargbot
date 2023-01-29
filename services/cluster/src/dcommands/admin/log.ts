import type { CommandResult, GuildCommandContext } from '@blargbot/cluster/types.js';
import { CommandType, guard } from '@blargbot/cluster/utils/index.js';
import { markup } from '@blargbot/discord-util';
import type { StoredGuildEventLogType } from '@blargbot/domain/models/index.js';
import type { IFormattable } from '@blargbot/formatting';
import { hasProperty } from '@blargbot/guards';
import type * as Eris from 'eris';

import { GuildCommand } from '../../command/index.js';
import templates from '../../text.js';

const cmd = templates.commands.log;

export class LogCommand extends GuildCommand {
    public constructor() {
        super({
            name: 'log',
            category: CommandType.ADMIN,
            definitions: [
                {
                    parameters: 'list',
                    description: cmd.list.description,
                    execute: ctx => this.listEvents(ctx)
                },
                {
                    parameters: 'enable {channel:channel} {eventNames[]}',
                    description: cmd.enable.description.default({ events: Object.entries(eventDescriptions).map(e => ({ key: e[0], desc: e[1] })) }),
                    execute: (ctx, [channel, eventNames]) => this.setEventChannel(ctx, eventNames.asStrings, channel.asChannel)
                },
                {
                    parameters: 'enable {channel:channel} all',
                    description: cmd.enable.description.all,
                    execute: (ctx, [channel]) => this.setEventChannel(ctx, Object.keys(eventDescriptions), channel.asChannel)
                },
                {
                    parameters: 'enable {channel:channel} roles|role {roles:role[]}',
                    description: cmd.enable.description.role,
                    execute: (ctx, [channel, roles]) => this.setEventChannel(ctx, roles.asRoles.map((r: Eris.Role) => `role:${r.id}`), channel.asChannel)
                },
                {
                    parameters: 'disable {eventNames[]}',
                    description: cmd.disable.description.default({ events: Object.entries(eventDescriptions).map(e => ({ key: e[0], desc: e[1] })) }),
                    execute: (ctx, [eventNames]) => this.setEventChannel(ctx, eventNames.asStrings, undefined)
                },
                {
                    parameters: 'disable all',
                    description: cmd.disable.description.all,
                    execute: (ctx) => this.setEventChannel(ctx, Object.keys(eventDescriptions), undefined)
                },
                {
                    parameters: 'disable roles|role {roles:role[]}',
                    description: cmd.disable.description.role,
                    execute: (ctx, [roles]) => this.setEventChannel(ctx, roles.asRoles.map((r: Eris.Role) => `role:${r.id}`), undefined)
                },
                {
                    parameters: 'ignore {users:sender[]}',
                    description: cmd.ignore.description,
                    execute: (ctx, [users]) => this.ignoreUsers(ctx, users.asSenders, true)
                },
                {
                    parameters: 'track {users:sender[]}',
                    description: cmd.track.description,
                    execute: (ctx, [users]) => this.ignoreUsers(ctx, users.asSenders, false)
                }
            ]
        });
    }

    public async setEventChannel(context: GuildCommandContext, eventnames: readonly string[], channel: Eris.KnownChannel | undefined): Promise<CommandResult> {
        if (channel !== undefined && (!guard.isGuildChannel(channel) || channel.guild !== context.channel.guild))
            return cmd.enable.notOnGuild;

        if (channel !== undefined && !guard.isTextableChannel(channel))
            return cmd.enable.notTextChannel;

        const validEvents: StoredGuildEventLogType[] = [];
        const invalidEvents = [];
        for (const event of eventnames) {
            const normEvent = event.toLowerCase();
            if (isLogEventType(normEvent))
                validEvents.push(normEvent);
            else
                invalidEvents.push(event);
        }

        if (invalidEvents.length > 0)
            return cmd.enable.eventInvalid({ events: invalidEvents });

        await context.database.guilds.setLogChannel(context.channel.guild.id, validEvents, channel?.id);
        const eventStrings = validEvents.map(e => {
            if (e.startsWith('role:'))
                return markup.role(e.slice(5));
            return `\`${e}\``;
        });

        return channel === undefined
            ? cmd.disable.success({ events: eventStrings })
            : cmd.enable.success({ channel, events: eventStrings });
    }

    public async listEvents(context: GuildCommandContext): Promise<CommandResult> {
        const channels = await context.database.guilds.getLogChannels(context.channel.guild.id);
        const ignoreUsers = await context.database.guilds.getLogIgnores(context.channel.guild.id);

        return {
            embeds: [
                {
                    fields: [
                        {
                            name: cmd.list.embed.field.current.name,
                            value: cmd.list.embed.field.current.value.template({
                                entries: [
                                    ...Object.entries<string | undefined>(channels.events)
                                        .filter((e): e is [string, string] => e[1] !== undefined)
                                        .map(([event, channelId]) => cmd.list.embed.field.current.value.event({ event, channelId })),
                                    ...Object.entries<string | undefined>(channels.roles)
                                        .filter((e): e is [string, string] => e[1] !== undefined)
                                        .map(([roleId, channelId]) => cmd.list.embed.field.current.value.role({ roleId, channelId }))
                                ]
                            }),
                            inline: true
                        },
                        {
                            name: cmd.list.embed.field.ignore.name,
                            value: cmd.list.embed.field.ignore.value({ userIds: ignoreUsers }),
                            inline: true
                        }
                    ]
                }
            ]
        };
    }

    public async ignoreUsers(context: GuildCommandContext, senders: ReadonlyArray<Eris.User | Eris.Webhook>, ignore: boolean): Promise<CommandResult> {
        await context.database.guilds.setLogIgnores(context.channel.guild.id, senders.map(u => u.id), ignore);
        return ignore
            ? cmd.ignore.success({ senderIds: senders.map(s => s.id) })
            : cmd.track.success({ senderIds: senders.map(s => s.id) });
    }
}

const eventDescriptions: { [key in Exclude<StoredGuildEventLogType, `role:${string}`>]: IFormattable<string> } = {
    avatarupdate: cmd.common.events.avatarupdate,
    kick: cmd.common.events.kick,
    memberban: cmd.common.events.memberban,
    memberjoin: cmd.common.events.memberjoin,
    memberleave: cmd.common.events.memberleave,
    membertimeout: cmd.common.events.membertimeout,
    membertimeoutclear: cmd.common.events.membertimeoutclear,
    memberunban: cmd.common.events.memberunban,
    messagedelete: cmd.common.events.messagedelete,
    messageupdate: cmd.common.events.messageupdate,
    nameupdate: cmd.common.events.nameupdate,
    nickupdate: cmd.common.events.nickupdate
};

function isLogEventType(eventName: string): eventName is StoredGuildEventLogType {
    return eventName.startsWith('role:') || hasProperty(eventDescriptions, eventName);
}
