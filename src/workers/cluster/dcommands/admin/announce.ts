import { BaseGuildCommand } from '@cluster/command';
import { GuildCommandContext } from '@cluster/types';
import { CommandType } from '@cluster/utils';
import { guard, humanize } from '@core/utils';
import { GuildChannels, MessageEmbedOptions, MessageMentionOptions, NewsChannel, Role, TextChannel, ThreadChannel } from 'discord.js';

export class AnnounceCommand extends BaseGuildCommand {
    public constructor() {
        super({
            name: 'announce',
            category: CommandType.ADMIN,
            definitions: [
                {
                    parameters: 'reset',
                    description: 'Resets the current configuration for announcements',
                    execute: (ctx) => this.reset(ctx)
                },
                {
                    parameters: 'configure {channel:channel?} {role:role?}',
                    description: 'Resets the current configuration for announcements',
                    execute: (ctx, [channel, role]) => this.configure(ctx, channel, role)
                },
                {
                    parameters: '{message+}',
                    description: 'Sends an announcement using the current configuration',
                    execute: (ctx, [message]) => this.announce(ctx, message)
                },
                {
                    parameters: 'info',
                    description: 'Displays the current configuration for announcements on this server',
                    execute: (ctx) => this.showInfo(ctx)
                }
            ]
        });
    }

    public async reset(context: GuildCommandContext): Promise<string> {
        await context.database.guilds.setAnnouncements(context.channel.guild.id, undefined);
        return this.success(`Announcement configuration reset! Do \`${context.prefix}announce configure\` to reconfigure it.`);
    }

    public async configure(context: GuildCommandContext, channel: GuildChannels | undefined, role: Role | undefined): Promise<string | undefined> {
        const result = await this.configureCore(context, channel, role);
        switch (result) {
            case true: return this.success('Your announcements have been configured!');
            case false: return undefined;
            default: return result;
        }
    }

    public async announce(context: GuildCommandContext, message: string): Promise<string> {

        let config = await this.getConfigSafe(context);
        if (config === undefined || config.channel === undefined || config.role === undefined) {
            const result = await this.configureCore(context, undefined, undefined);
            switch (result) {
                case true: break;
                case false: return this.error('You must configure a role and channel to use announcements!');
                default: return result;
            }
            config = await this.getConfigSafe(context);
            if (config === undefined || config.channel === undefined || config.role === undefined)
                return this.error('Oops, seems like your config changes didnt save! Please try again.');
        }

        const topRole = context.message.member.roles.color;
        const mentions: MessageMentionOptions = config.role.id === config.role.guild.id
            ? { parse: ['everyone'] }
            : { roles: [config.role.id] };
        const embed: MessageEmbedOptions = {
            description: message,
            color: topRole?.color,
            author: {
                name: 'Announcement',
                icon_url: 'http://i.imgur.com/zcGyun6.png',
                url: `https://blargbot.xyz/user/${context.author.id}`
            },
            footer: {
                text: humanize.fullName(context.author),
                icon_url: context.author.displayAvatarURL({ dynamic: true, format: 'png', size: 512 })
            },
            timestamp: context.timestamp
        };

        const announcement = await context.util.send(config.channel, {
            content: config.role.toString(),
            embeds: [embed],
            allowedMentions: mentions
        });

        if (announcement === undefined)
            return this.error('I wasnt able to send that message for some reason!');

        if (announcement.crosspostable)
            await announcement.crosspost();

        return this.success('I\'ve sent the announcement!');
    }

    public async showInfo(context: GuildCommandContext): Promise<string> {
        const config = await this.getConfigSafe(context);
        if (config === undefined)
            return this.info(`Announcements are not yet configured for this server. Please use \`${context.prefix}announce configure\` to set them up`);

        if (config.channel === undefined || config.role === undefined) {
            await this.reset(context);
            const reason = config.channel === undefined ? config.role === undefined
                ? 'Your announcement channel and role no longer exist'
                : 'Your announcement channel no longer exists'
                : 'Your announcement role no longer exists';

            return this.error(`${reason}. Please use \`${context.prefix}announce configure\` to reconfigure your announcements`);
        }

        return this.info(`Announcements will be sent in ${config.channel.toString()} and will mention ${config.role.toString()}`);
    }

    private async getConfigSafe(context: GuildCommandContext): Promise<{ channel: TextChannel | NewsChannel | ThreadChannel | undefined; role: Role | undefined; } | undefined> {
        const config = await context.database.guilds.getAnnouncements(context.channel.guild.id);
        if (config === undefined)
            return undefined;

        let channel = await context.util.getChannelById(config.channel);
        const role = await context.util.getRoleById(context.channel.guild.id, config.role);

        if (channel === undefined || !guard.isGuildChannel(channel) || !guard.isTextableChannel(channel) || guard.isThreadChannel(channel) && channel.archived === true)
            channel = undefined;

        return { channel, role };
    }

    private async configureCore(context: GuildCommandContext, channel: GuildChannels | undefined, role: Role | undefined): Promise<boolean | string> {
        if (channel === undefined) {
            const response = await context.util.awaitQuery(
                context.channel,
                context.author,
                this.info('Please mention the channel that announcements should be put in.'));

            if (response === undefined)
                return false;

            const mentioned = response.mentions.channels.first();
            if (mentioned === undefined)
                return this.error('You need to tell me what channel to send announcements in!');

            if (!guard.isGuildChannel(mentioned) || mentioned.guild.id !== context.channel.guild.id)
                return this.error(`${mentioned.toString()} is not a channel on this guild!`);

            if (!guard.isTextableChannel(mentioned))
                return this.error(`${mentioned.toString()} is not a text channel!`);

            channel = mentioned;
        }

        if (role === undefined) {
            const response = await context.util.awaitQuery(
                context.channel,
                context.author,
                this.info('Please type the name or ID of the role to announce to.'));

            if (response === undefined)
                return false;

            const mentioned = response.mentions.roles.first();
            if (mentioned !== undefined)
                role = mentioned;
            else {
                const found = await context.util.getRole(context, response.content);
                if (found === undefined)
                    return this.error('I couldnt find a role with that name or id!');

                role = found;
            }
        }

        await context.database.guilds.setAnnouncements(context.channel.guild.id, {
            channel: channel.id,
            role: role.id
        });
        return true;
    }
}
