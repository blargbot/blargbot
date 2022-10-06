import { GuildCommand } from '@blargbot/cluster/command';
import { GuildCommandContext } from '@blargbot/cluster/types';
import { CommandType, discord } from '@blargbot/cluster/utils';
import { humanize } from '@blargbot/core/utils';
import { AllowedMentions, Constants, EmbedOptions, KnownChannel, Role } from 'eris';
import moment from 'moment-timezone';

export class AnnounceCommand extends GuildCommand {
    public constructor() {
        super({
            name: `announce`,
            category: CommandType.ADMIN,
            definitions: [
                {
                    parameters: `reset`,
                    description: `Resets the current configuration for announcements`,
                    execute: (ctx) => this.reset(ctx)
                },
                {
                    parameters: `configure {channel:channel?} {role:role?}`,
                    description: `Resets the current configuration for announcements`,
                    execute: (ctx, [channel, role]) => this.configure(ctx, channel.asOptionalChannel, role.asOptionalRole)
                },
                {
                    parameters: `{message+}`,
                    description: `Sends an announcement using the current configuration`,
                    execute: (ctx, [message]) => this.announce(ctx, message.asString)
                },
                {
                    parameters: `info`,
                    description: `Displays the current configuration for announcements on this server`,
                    execute: (ctx) => this.showInfo(ctx)
                }
            ]
        });
    }

    public async reset(context: GuildCommandContext): Promise<string> {
        await context.cluster.announcements.clearConfig(context.channel.guild);
        return this.success(`Announcement configuration reset! Do \`${context.prefix}announce configure\` to reconfigure it.`);
    }

    public async configure(context: GuildCommandContext, channel: KnownChannel | undefined, role: Role | undefined): Promise<string> {
        const result = await context.cluster.announcements.loadConfig(context.channel.guild, context.author, context.channel, { channel, role });
        switch (result.state) {
            case `ChannelInvalid`: return this.error(`The announcement channel must be a text channel!`);
            case `ChannelNotFound`: return this.error(`No channel is set up for announcements`);
            case `ChannelNotInGuild`: return this.error(`The announcement channel must be on this server!`);
            case `NotAllowed`: return this.error(`You cannot send announcements`);
            case `RoleNotFound`: return this.error(`No role is set up for announcements`);
            case `TimedOut`: return this.error(`You must configure a role and channel to use announcements!`);
            case `Success`: return this.success(`Your announcements have been configured!`);
        }
    }

    public async announce(context: GuildCommandContext, message: string): Promise<string> {
        const configResult = await context.cluster.announcements.loadConfig(context.channel.guild, context.author, context.channel);
        switch (configResult.state) {
            case `ChannelInvalid`: return this.error(`The announcement channel must be a text channel!`);
            case `ChannelNotFound`: return this.error(`No channel is set up for announcements`);
            case `ChannelNotInGuild`: return this.error(`The announcement channel must be on this server!`);
            case `NotAllowed`: return this.error(`You cannot send announcements`);
            case `RoleNotFound`: return this.error(`No role is set up for announcements`);
            case `TimedOut`: return this.error(`You must configure a role and channel to use announcements!`);
        }
        const config = configResult.detail;
        const color = discord.getMemberColor(context.message.member);
        const mentions: AllowedMentions = config.role.id === config.role.guild.id
            ? { everyone: true }
            : { roles: [config.role.id] };
        const embed: EmbedOptions = {
            description: message,
            color: color,
            author: {
                name: `Announcement`,
                icon_url: `http://i.imgur.com/zcGyun6.png`,
                url: `https://blargbot.xyz/user/${context.author.id}`
            },
            footer: {
                text: humanize.fullName(context.author),
                icon_url: context.author.avatarURL
            },
            timestamp: moment(context.timestamp).toDate()
        };

        const announcement = await context.send(config.channel, {
            content: config.role.mention,
            embeds: [embed],
            allowedMentions: mentions
        });

        if (announcement === undefined)
            return this.error(`I wasnt able to send that message for some reason!`);

        if (announcement.channel.type === Constants.ChannelTypes.GUILD_NEWS)
            await announcement.crosspost();

        return this.success(`I've sent the announcement!`);
    }

    public async showInfo(context: GuildCommandContext): Promise<string> {
        const config = await context.cluster.announcements.getCurrentConfig(context.channel.guild);
        if (config.channel === undefined && config.role === undefined)
            return this.info(`Announcements are not yet configured for this server. Please use \`${context.prefix}announce configure\` to set them up`);

        const channelStr = config.channel?.mention ?? `\`<unconfigured>\``;
        const roleStr = config.role?.mention ?? `\`<unconfigured>\``;

        return this.info(`Announcements will be sent in ${channelStr} and will mention ${roleStr}`);
    }
}
