import { GuildCommand } from '@blargbot/cluster/command';
import { GuildCommandContext } from '@blargbot/cluster/types';
import { CommandType, guard, humanize } from '@blargbot/cluster/utils';
import { StoredGuildEventLogType } from '@blargbot/domain/models';
import { EmbedField, EmbedOptions, KnownChannel, Role, User, Webhook } from 'eris';

export class LogCommand extends GuildCommand {
    public constructor() {
        super({
            name: `log`,
            category: CommandType.ADMIN,
            definitions: [
                {
                    parameters: `list`,
                    description: `Lists all the events currently being logged`,
                    execute: ctx => this.listEvents(ctx)
                },
                {
                    parameters: `enable {channel:channel} {eventNames[]}`,
                    description: `Sets the channel to log the given events to. Available events are:\n${Object.entries(eventDescriptions).map(([key, desc]) => `\`${key}\` - ${desc}`).join(`\n`)}`,
                    execute: (ctx, [channel, eventNames]) => this.setEventChannel(ctx, eventNames.asStrings, channel.asChannel)
                },
                {
                    parameters: `enable {channel:channel} all`,
                    description: `Sets the channel to log all events to, except role related events.`,
                    execute: (ctx, [channel]) => this.setEventChannel(ctx, Object.keys(eventDescriptions), channel.asChannel)
                },
                {
                    parameters: `enable {channel:channel} roles|role {roles:role[]}`,
                    description: `Sets the channel to log when someone gets or loses a role.`,
                    execute: (ctx, [channel, roles]) => this.setEventChannel(ctx, roles.asRoles.map((r: Role) => `role:${r.id}`), channel.asChannel)
                },
                {
                    parameters: `disable {eventNames[]}`,
                    description: `Disables logging of the given events. Available events are:\n${Object.entries(eventDescriptions).map(([key, desc]) => `\`${key}\` - ${desc}`).join(`\n`)}`,
                    execute: (ctx, [eventNames]) => this.setEventChannel(ctx, eventNames.asStrings, undefined)
                },
                {
                    parameters: `disable all`,
                    description: `Disables logging of all events except role related events.`,
                    execute: (ctx) => this.setEventChannel(ctx, Object.keys(eventDescriptions), undefined)
                },
                {
                    parameters: `disable roles|role {roles:role[]}`,
                    description: `Stops logging when someone gets or loses a role.`,
                    execute: (ctx, [roles]) => this.setEventChannel(ctx, roles.asRoles.map((r: Role) => `role:${r.id}`), undefined)
                },
                {
                    parameters: `ignore {users:sender[]}`,
                    description: `Ignores any tracked events concerning the users`,
                    execute: (ctx, [users]) => this.ignoreUsers(ctx, users.asSenders, true)
                },
                {
                    parameters: `track {users:sender[]}`,
                    description: `Removes the users from the list of ignored users and begins tracking events from them again`,
                    execute: (ctx, [users]) => this.ignoreUsers(ctx, users.asSenders, false)
                }
            ]
        });
    }

    public async setEventChannel(context: GuildCommandContext, eventnames: readonly string[], channel: KnownChannel | undefined): Promise<string> {
        if (channel !== undefined && (!guard.isGuildChannel(channel) || channel.guild !== context.channel.guild))
            return `❌ The log channel must be on this server!`;

        if (channel !== undefined && !guard.isTextableChannel(channel))
            return `❌ The log channel must be a text channel!`;

        const validEvents: StoredGuildEventLogType[] = [];
        const invalidEvents = [];
        for (const event of eventnames) {
            const normEvent = event.toLowerCase();
            if (isLogEventType(normEvent))
                validEvents.push(normEvent);
            else
                invalidEvents.push(event);
        }

        switch (invalidEvents.length) {
            case 0: break;
            case 1: return `❌ ${invalidEvents[0]} is not a valid event`;
            default: return `❌ ${humanize.smartJoin(invalidEvents, `, `, ` and `)} are not valid events`;
        }

        await context.database.guilds.setLogChannel(context.channel.guild.id, validEvents, channel?.id);
        const eventStrings = validEvents.map(e => {
            if (e.startsWith(`role:`))
                return `<@&${e.slice(5)}>`;
            return `\`${e}\``;
        });

        if (channel !== undefined)
            return `✅ I will now log the following events in ${channel.mention}:\n${eventStrings.join(`\n`)}`;
        return `✅ I will no longer log the following events:\n${eventStrings.join(`\n`)}`;
    }

    public async listEvents(context: GuildCommandContext): Promise<EmbedOptions> {
        const channels = await context.database.guilds.getLogChannels(context.channel.guild.id);
        const ignoreUsers = await context.database.guilds.getLogIgnores(context.channel.guild.id);
        const ignoreUsersField: EmbedField = {
            name: `Ignored users`,
            value: ignoreUsers.size === 0 ? `No ignored users` : [...ignoreUsers].map(id => `<@${id}> (${id})`).join(`\n`),
            inline: true
        };

        if (Object.values<string | undefined>(channels.events).every(e => e === undefined)) {
            return {
                fields: [
                    { name: `Currently logged events`, value: `No logged events`, inline: true },
                    ignoreUsersField
                ]
            };
        }

        return {
            fields: [
                {
                    name: `Currently logged events`,
                    value: [
                        ...Object.entries<string | undefined>(channels.events)
                            .filter((e): e is [string, string] => e[1] !== undefined)
                            .map(([eventName, channelId]) => `**${eventName}** - <#${channelId}>`),
                        ...Object.entries<string | undefined>(channels.roles)
                            .filter((e): e is [string, string] => e[1] !== undefined)
                            .map(([roleId, channelId]) => `**<@&${roleId}>** - <#${channelId}>`)
                    ].join(`\n`),
                    inline: true
                },
                ignoreUsersField
            ]
        };
    }

    public async ignoreUsers(context: GuildCommandContext, senders: ReadonlyArray<User | Webhook>, ignore: boolean): Promise<string> {
        await context.database.guilds.setLogIgnores(context.channel.guild.id, senders.map(u => u.id), ignore);

        const mentions = senders.map(s => `<@${s.id}>`);
        if (ignore)
            return `✅ I will now ignore events from ${humanize.smartJoin(mentions, `, `, ` and `)}`;
        return `✅ I will no longer ignore events from ${humanize.smartJoin(mentions, `, `, ` and `)}`;
    }
}

const eventDescriptions: { [key in Exclude<StoredGuildEventLogType, `role:${string}`>]: string } = {
    avatarupdate: `Triggered when someone changes their username`,
    kick: `Triggered when a member is kicked`,
    memberban: `Triggered when a member is banned`,
    memberjoin: `Triggered when someone joins`,
    memberleave: `Triggered when someone leaves`,
    membertimeout: `Triggered when someone is timed out`,
    membertimeoutclear: `Triggered when someone's timeout is removed`,
    memberunban: `Triggered when someone is unbanned`,
    messagedelete: `Triggered when someone deletes a message they sent`,
    messageupdate: `Triggered when someone updates a message they sent`,
    nameupdate: `Triggered when someone changes their username or discriminator`,
    nickupdate: `Triggered when someone changes their nickname`
};

function isLogEventType(eventName: string): eventName is StoredGuildEventLogType {
    return eventName.startsWith(`role:`) || guard.hasProperty(eventDescriptions, eventName);
}
