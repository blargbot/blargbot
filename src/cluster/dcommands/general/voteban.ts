import { GuildCommand } from '@blargbot/cluster/command';
import { CommandResult, GuildCommandContext } from '@blargbot/cluster/types';
import { CommandType, discord, pluralise as p } from '@blargbot/cluster/utils';
import { guard } from '@blargbot/core/utils';
import { Member } from 'eris';

import templates from '../../text';

const cmd = templates.commands.voteBan;

export class VoteBanCommand extends GuildCommand {
    public constructor() {
        super({
            name: `voteban`,
            aliases: [`pollban`, `vb`, `pb`],
            category: CommandType.GENERAL,
            description: cmd.description,
            definitions: [
                {
                    parameters: ``,
                    description: cmd.list.description,
                    execute: (ctx) => this.getTop(ctx)
                },
                {
                    parameters: `info {user:member+}`,
                    description: cmd.info.description,
                    execute: (ctx, [user]) => this.getVotes(ctx, user.asMember)
                },
                {
                    parameters: `{user:member} {reason+?}`,
                    description: cmd.sign.description,
                    execute: (ctx, [user, reason]) => this.sign(ctx, user.asMember, reason.asOptionalString)
                },
                {
                    parameters: `forgive {user:member+}`,
                    description: cmd.forgive.description,
                    execute: (ctx, [user]) => this.unsign(ctx, user.asMember)
                }
            ]
        });
    }

    public async getTop(context: GuildCommandContext): Promise<CommandResult> {
        const votebans = await context.database.guilds.getVoteBans(context.channel.guild.id);

        const entries = votebans === undefined ? [] : Object.entries(votebans)
            .map(e => [e[0], e[1]?.length ?? 0] as const)
            .filter(e => e[1] > 0)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map((e, i) => `**${i + 1}.** <@${e[0]}> - ${e[1]} ${p(e[1], `signature`)}`);

        return {
            author: context.util.embedifyAuthor(context.channel.guild),
            title: `ℹ️ Top 10 Vote bans`,
            description: entries.length === 0 ? `No petitions have been signed yet!` : entries.join(`\n`)
        };
    }

    public async getVotes(context: GuildCommandContext, user: Member): Promise<CommandResult> {
        const votes = await context.database.guilds.getVoteBans(context.channel.guild.id, user.id) ?? [];
        const voteLines = votes.map(v => guard.hasValue(v.reason) ? `<@${v.id}> - ${v.reason}` : `<@${v.id}>`);

        return {
            author: context.util.embedifyAuthor(user),
            color: discord.getMemberColor(user),
            title: `ℹ️ Vote ban signatures`,
            description: voteLines.length === 0 ? `No one has voted to ban ${user.mention} yet.`
                : voteLines.length > 20 ? `${voteLines.slice(0, 15).join(`\n`)}\n... and ${votes.length - 15} more`
                    : voteLines.join(`\n`)
        };
    }

    public async sign(context: GuildCommandContext, user: Member, reason: string | undefined): Promise<CommandResult> {
        if (await context.database.guilds.hasVoteBanned(context.channel.guild.id, user.id, context.author.id))
            return `❌ I know youre eager, but you have already signed the petition to ban ${user.mention}!`;

        const newTotal = await context.database.guilds.addVoteBan(context.channel.guild.id, user.id, context.author.id, reason);
        if (newTotal === false)
            return `❌ Seems the petitions office didnt like that one! Please try again`;

        return `✅ ${context.author.mention} has signed to ban ${user.mention}! A total of **${newTotal} ${p(newTotal, `person** has`, `people** have`)} signed the petition now.${reason !== undefined ? `\n**Reason**: ${reason}` : ``}`;
    }

    public async unsign(context: GuildCommandContext, user: Member): Promise<CommandResult> {
        if (!await context.database.guilds.hasVoteBanned(context.channel.guild.id, user.id, context.author.id))
            return `❌ Thats very kind of you, but you havent even signed to ban ${user.mention} yet!`;

        const newTotal = await context.database.guilds.removeVoteBan(context.channel.guild.id, user.id, context.author.id);
        if (newTotal === false)
            return `❌ Seems the petitions office didnt like that one! Please try again`;

        return `✅ ${context.author.mention} reconsidered and forgiven ${user.mention}! A total of **${newTotal} ${p(newTotal, `person** has`, `people** have`)} signed the petition now.`;
    }
}
