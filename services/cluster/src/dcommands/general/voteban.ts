import { GuildCommand } from '../../command/index';
import { CommandResult, GuildCommandContext } from '@blargbot/cluster/types';
import { CommandType, discord } from '@blargbot/cluster/utils';
import Eris from 'eris';

import templates from '../../text';

const cmd = templates.commands.voteBan;

export class VoteBanCommand extends GuildCommand {
    public constructor() {
        super({
            name: 'voteban',
            aliases: ['pollban', 'vb', 'pb'],
            category: CommandType.GENERAL,
            description: cmd.description,
            definitions: [
                {
                    parameters: '',
                    description: cmd.list.description,
                    execute: (ctx) => this.getTop(ctx)
                },
                {
                    parameters: 'info {user:member+}',
                    description: cmd.info.description,
                    execute: (ctx, [user]) => this.getVotes(ctx, user.asMember)
                },
                {
                    parameters: '{user:member} {reason+?}',
                    description: cmd.sign.description,
                    execute: (ctx, [user, reason]) => this.sign(ctx, user.asMember.user, reason.asOptionalString)
                },
                {
                    parameters: 'forgive {user:member+}',
                    description: cmd.forgive.description,
                    execute: (ctx, [user]) => this.unsign(ctx, user.asMember.user)
                }
            ]
        });
    }

    public async getTop(context: GuildCommandContext): Promise<CommandResult> {
        const votebans = await context.database.guilds.getVoteBans(context.channel.guild.id) ?? {};
        return {
            embeds: [
                {
                    author: context.util.embedifyAuthor(context.channel.guild),
                    title: cmd.list.embed.title,
                    description: cmd.list.embed.description({
                        items: Object.entries(votebans)
                            .filter((e): e is [string, Exclude<typeof e[1], undefined>] => e[1] !== undefined)
                            .sort((a, b) => b[1].length - a[1].length)
                            .slice(0, 10)
                            .map((e, i) => ({
                                userId: e[0],
                                count: e[1].length,
                                index: i + 1
                            }))
                    })
                }
            ]
        };
    }

    public async getVotes(context: GuildCommandContext, user: Eris.Member): Promise<CommandResult> {
        const votes = await context.database.guilds.getVoteBans(context.channel.guild.id, user.id) ?? [];
        return {
            embeds: [
                {
                    author: context.util.embedifyAuthor(user),
                    color: discord.getMemberColour(user),
                    title: cmd.info.embed.title,
                    description: cmd.info.embed.description({
                        user: user.user,
                        votes: votes.slice(0, 15)
                            .map(e => ({
                                userId: e.id,
                                reason: e.reason
                            })),
                        excess: Math.max(0, votes.length - 15)
                    })
                }
            ]
        };
    }

    public async sign(context: GuildCommandContext, user: Eris.User, reason: string | undefined): Promise<CommandResult> {
        if (await context.database.guilds.hasVoteBanned(context.channel.guild.id, user.id, context.author.id))
            return cmd.sign.alreadySigned({ user });

        const newTotal = await context.database.guilds.addVoteBan(context.channel.guild.id, user.id, context.author.id, reason);
        if (newTotal === false)
            return cmd.errors.failed;

        return cmd.sign.success({
            user: context.author,
            target: user,
            reason,
            total: newTotal
        });
    }

    public async unsign(context: GuildCommandContext, user: Eris.User): Promise<CommandResult> {
        if (!await context.database.guilds.hasVoteBanned(context.channel.guild.id, user.id, context.author.id))
            return cmd.forgive.notSigned({ user });

        const newTotal = await context.database.guilds.removeVoteBan(context.channel.guild.id, user.id, context.author.id);
        if (newTotal === false)
            return cmd.errors.failed;

        return cmd.forgive.success({
            user: context.author,
            target: user,
            total: newTotal
        });
    }
}
