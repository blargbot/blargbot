import { CommandContext, GlobalCommand } from '../../command/index';
import { CommandType, discord, guard, parse } from '@blargbot/cluster/utils';
import Eris from 'eris';

import templates from '../../text';
import { CommandResult } from '../../types';

const cmd = templates.commands.user;

export class UserCommand extends GlobalCommand {
    public constructor() {
        super({
            name: 'user',
            category: CommandType.GENERAL,
            definitions: [
                {
                    parameters: '{user:user+?}',
                    description: cmd.default.description,
                    execute: (ctx, [user]) => this.getUser(ctx, user.asOptionalUser ?? ctx.author)
                }
            ]
        });
    }

    public async getUser(context: CommandContext, user: Eris.User): Promise<CommandResult> {
        const member = guard.isGuildCommandContext(context) ? await context.util.getMember(context.channel.guild, user.id) : undefined;
        if (member === undefined) {
            return {
                embeds: [
                    {
                        author: {
                            name: cmd.default.embed.author.name.user({ user }),
                            icon_url: user.avatarURL
                        },
                        thumbnail: {
                            url: user.avatarURL
                        },
                        description: cmd.default.embed.description.user({ user })
                    }
                ]
            };
        }
        const activity = member.activities?.[0];
        return {
            embeds: [
                {
                    author: {
                        name: cmd.default.embed.author.name.member({ user: member }),
                        icon_url: member.user.avatarURL
                    },
                    thumbnail: {
                        url: member.avatarURL
                    },
                    color: discord.getMemberColour(member),
                    description: cmd.default.embed.description.member({ user: member }),
                    fields: [
                        {
                            name: cmd.default.embed.field.roles.name,
                            value: cmd.default.embed.field.roles.value({
                                roles: member.roles.map(r => member.guild.roles.get(r))
                                    .filter((r): r is Exclude<typeof r, undefined> => r !== undefined)
                                    .filter(r => r.position !== 0)
                                    .sort((a, b) => b.position - a.position)
                            })
                        }
                    ],
                    footer: {
                        icon_url: `https://cdn.discordapp.com/emojis/${getStatusEmoteId(context, member)}.png`,
                        text: activity === undefined
                            ? cmd.default.activity.default
                            : cmd.default.activity[activity.type](activity)
                    }
                }
            ]
        };
    }
}

function getStatusEmoteId(context: CommandContext, member: Eris.Member): string {
    const emote = getStatusEmote(context, member);
    return parse.entityId(emote) ?? '';
}

function getStatusEmote(context: CommandContext, member: Eris.Member): string {
    switch (member.status) {
        case 'dnd': return context.config.discord.emotes.busy;
        case 'idle': return context.config.discord.emotes.away;
        case 'online': return context.config.discord.emotes.online;
        case undefined: return context.config.discord.emotes.offline;
    }
}
