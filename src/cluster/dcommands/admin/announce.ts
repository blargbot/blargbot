import { GuildCommand } from '@blargbot/cluster/command';
import { CommandResult, GuildCommandContext } from '@blargbot/cluster/types';
import { CommandType, discord } from '@blargbot/cluster/utils';
import { humanize } from '@blargbot/core/utils';
import { AllowedMentions, Constants, KnownChannel, Role } from 'eris';
import moment from 'moment-timezone';

import templates from '../../text';

const cmd = templates.commands.announce;

export class AnnounceCommand extends GuildCommand {
    public constructor() {
        super({
            name: `announce`,
            category: CommandType.ADMIN,
            definitions: [
                {
                    parameters: `reset`,
                    description: cmd.reset.description,
                    execute: (ctx) => this.reset(ctx)
                },
                {
                    parameters: `configure {channel:channel?} {role:role?}`,
                    description: cmd.configure.description,
                    execute: (ctx, [channel, role]) => this.configure(ctx, channel.asOptionalChannel, role.asOptionalRole)
                },
                {
                    parameters: `{message+}`,
                    description: cmd.default.description,
                    execute: (ctx, [message]) => this.announce(ctx, message.asString)
                },
                {
                    parameters: `info`,
                    description: cmd.info.description,
                    execute: (ctx) => this.showInfo(ctx)
                }
            ]
        });
    }

    public async reset(context: GuildCommandContext): Promise<CommandResult> {
        await context.cluster.announcements.clearConfig(context.channel.guild);
        return cmd.reset.success(context);
    }

    public async configure(context: GuildCommandContext, channel: KnownChannel | undefined, role: Role | undefined): Promise<CommandResult> {
        const result = await context.cluster.announcements.loadConfig(context.channel.guild, context.author, context.channel, { channel, role });
        return cmd.configure.state[result.state];
    }

    public async announce(context: GuildCommandContext, message: string): Promise<CommandResult> {
        const configResult = await context.cluster.announcements.loadConfig(context.channel.guild, context.author, context.channel);
        if (configResult.state !== `Success`)
            return cmd.configure.state[configResult.state];

        const config = configResult.detail;
        const color = discord.getMemberColor(context.message.member);
        const mentions: AllowedMentions = config.role.id === config.role.guild.id
            ? { everyone: true }
            : { roles: [config.role.id] };

        const announcement = await context.send(config.channel, {
            content: config.role.mention,
            embeds: [
                {
                    description: message,
                    color: color,
                    author: {
                        name: cmd.default.embed.author.name,
                        icon_url: `http://i.imgur.com/zcGyun6.png`,
                        url: `https://blargbot.xyz/user/${context.author.id}`
                    },
                    footer: {
                        text: humanize.fullName(context.author),
                        icon_url: context.author.avatarURL
                    },
                    timestamp: moment(context.timestamp).toDate()
                }
            ],
            allowedMentions: mentions
        });

        if (announcement === undefined)
            return cmd.default.failed;

        if (announcement.channel.type === Constants.ChannelTypes.GUILD_NEWS)
            await announcement.crosspost();

        return cmd.default.success;
    }

    public async showInfo(context: GuildCommandContext): Promise<CommandResult> {
        const config = await context.cluster.announcements.getCurrentConfig(context.channel.guild);
        if (config.channel === undefined && config.role === undefined)
            return cmd.info.unconfigured(context);
        return cmd.info.details(config);
    }
}
