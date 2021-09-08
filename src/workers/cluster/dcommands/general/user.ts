import { BaseGlobalCommand, CommandContext } from '@cluster/command';
import { CommandType, guard, parse } from '@cluster/utils';
import { Activity, GuildMember, MessageEmbedOptions, User } from 'discord.js';
import moment from 'moment';

export class UserCommand extends BaseGlobalCommand {
    public constructor() {
        super({
            name: 'user',
            category: CommandType.GENERAL,
            definitions: [
                {
                    parameters: '{user:user+?}',
                    description: 'Gets information about a user',
                    execute: (ctx, [user]) => this.getUser(ctx, user.asOptionalUser ?? ctx.author)
                }
            ]
        });
    }

    public async getUser(context: CommandContext, user: User): Promise<MessageEmbedOptions> {
        const result = {
            ...<MessageEmbedOptions>{},
            author: context.util.embedifyAuthor(user),
            thumbnail: {
                url: user.displayAvatarURL({ dynamic: true, format: 'png', size: 512 })
            },
            description: `**User Id** ${user.id}\n**Created** ${timestamp(user.createdAt)}`
        };

        if (guard.isGuildCommandContext(context)) {
            const member = await context.util.getMember(context.channel.guild, user.id);
            if (member !== undefined) {
                result.description += `\n**Joined** ${timestamp(member.joinedAt)}
**Permissions** ${member.permissions.bitfield} [(Permission calculator)](https://discordapi.com/permissions.html#${member.permissions.bitfield})`;
                result.fields = [
                    {
                        name: 'Roles',
                        value: member.roles.cache
                            .filter(r => r.position !== 0) // @everyone
                            .sort((a, b) => b.position - a.position) // descending
                            .map(r => r.toString())
                            .join(' ') + '\u200b'
                    }
                ];
                if (member.nickname !== null)
                    result.author.name += ` (${member.nickname})`;
                result.color = member.roles.color?.color;
                result.footer = {
                    iconURL: `https://cdn.discordapp.com/emojis/${getStatusEmoteId(context, member)}.png`,
                    text: getActivityString(member.presence?.activities[0])
                };
            }
        }

        if (user.bot)
            result.author.name = `🤖 ${result.author.name ?? ''}`;

        return result;
    }

}

function timestamp(value: Date | null): string {
    if (value === null)
        return '-';

    const unix = moment(value).unix();
    return `<t:${unix}>`;
}

function getStatusEmoteId(context: CommandContext, member: GuildMember): string {
    const emote = getStatusEmote(context, member);
    return parse.entityId(emote) ?? '';
}

function getStatusEmote(context: CommandContext, member: GuildMember): string {
    switch (member.presence?.status) {
        case 'dnd': return context.config.discord.emotes.busy;
        case 'idle': return context.config.discord.emotes.away;
        case 'online': return context.config.discord.emotes.online;
        case 'invisible':
        case 'offline':
        case undefined: return context.config.discord.emotes.offline;
    }
}

function getActivityString(activity: Activity | undefined): string {
    switch (activity?.type) {
        case undefined: return 'Not doing anything';
        case 'COMPETING': return `Competing in ${activity.name}`;
        case 'CUSTOM': return activity.name;
        case 'LISTENING': return `Listening to ${activity.name}`;
        case 'PLAYING': return `Playing ${activity.name}`;
        case 'STREAMING': return `Streaming ${activity.details ?? ''}`.trim();
        case 'WATCHING': return `Watching ${activity.name}`;
    }
}
