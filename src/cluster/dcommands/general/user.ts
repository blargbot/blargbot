import { BaseGlobalCommand, CommandContext } from '@blargbot/cluster/command';
import { CommandType, discord, guard, parse } from '@blargbot/cluster/utils';
import { Activity, Constants, EmbedOptions, Member, User } from 'eris';
import moment from 'moment-timezone';

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

    public async getUser(context: CommandContext, user: User): Promise<EmbedOptions> {
        const result = {
            ...<EmbedOptions>{},
            author: context.util.embedifyAuthor(user),
            thumbnail: {
                url: user.avatarURL
            },
            description: `**User Id**: ${user.id}\n**Created**: ${timestamp(user.createdAt)}`
        };

        if (guard.isGuildCommandContext(context)) {
            const member = await context.util.getMember(context.channel.guild, user.id);
            if (member !== undefined) {
                result.description += `\n**Joined**: ${timestamp(member.joinedAt)}
**Permission**: [${member.permissions.allow}](https://discordapi.com/permissions.html#${member.permissions.allow})`;
                result.fields = [
                    {
                        name: 'Roles',
                        value: member.roles
                            .map(r => ({ id: r, pos: member.guild.roles.get(r)?.position ?? -Infinity }))
                            .filter(r => r.pos !== 0) // @everyone
                            .sort((a, b) => b.pos - a.pos) // descending
                            .map(r => `<@&${r.id}>`)
                            .join(' ') + '\u200b'
                    }
                ];
                if (member.nick !== null)
                    result.author.name += ` (${member.nick})`;
                result.color = discord.getMemberColor(member);
                result.footer = {
                    icon_url: `https://cdn.discordapp.com/emojis/${getStatusEmoteId(context, member)}.png`,
                    text: getActivityString(member.activities?.[0])
                };
            }
        }

        if (user.bot)
            result.author.name = `🤖 ${result.author.name}`;

        return result;
    }

}

function timestamp(value: number | null): string {
    if (value === null)
        return '-';

    const unix = moment(value).unix();
    return `<t:${unix}>`;
}

function getStatusEmoteId(context: CommandContext, member: Member): string {
    const emote = getStatusEmote(context, member);
    return parse.entityId(emote) ?? '';
}

function getStatusEmote(context: CommandContext, member: Member): string {
    switch (member.status) {
        case 'dnd': return context.config.discord.emotes.busy;
        case 'idle': return context.config.discord.emotes.away;
        case 'online': return context.config.discord.emotes.online;
        case 'offline':
        case undefined: return context.config.discord.emotes.offline;
    }
}

function getActivityString(activity: Activity | undefined): string {
    switch (activity?.type) {
        case undefined: return 'Not doing anything';
        case Constants.ActivityTypes.COMPETING: return `Competing in ${activity.name}`;
        case Constants.ActivityTypes.CUSTOM: return activity.name;
        case Constants.ActivityTypes.LISTENING: return `Listening to ${activity.name}`;
        case Constants.ActivityTypes.GAME: return `Playing ${activity.name}`;
        case Constants.ActivityTypes.STREAMING: return `Streaming ${activity.details ?? ''}`.trim();
        case Constants.ActivityTypes.WATCHING: return `Watching ${activity.name}`;
    }
}
