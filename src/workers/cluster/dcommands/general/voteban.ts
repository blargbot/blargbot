import { BaseGuildCommand } from '@cluster/command';
import { GuildCommandContext } from '@cluster/types';
import { CommandType, pluralise as p } from '@cluster/utils';
import { GuildMember, MessageEmbedOptions } from 'discord.js';

export class VoteBanCommand extends BaseGuildCommand {
    public constructor() {
        super({
            name: 'voteban',
            aliases: ['pollban', 'vb', 'pb'],
            category: CommandType.GENERAL,
            description: 'Its a meme, dont worry',
            definitions: [
                {
                    parameters: '',
                    description: 'Gets the people with the most votes to be banned.',
                    execute: (ctx) => this.getTop(ctx)
                },
                {
                    parameters: 'info {user:member+}',
                    description: 'Checks the status of the petition to ban someone.',
                    execute: (ctx, [user]) => this.getVotes(ctx, user)
                },
                {
                    parameters: '{user:member} {reason+?}',
                    description: 'Signs a petition to ban a someone',
                    execute: (ctx, [user, reason]) => this.sign(ctx, user, reason)
                },
                {
                    parameters: 'forgive {user:member+}',
                    description: 'Removes your signature to ban someone',
                    execute: (ctx, [user]) => this.unsign(ctx, user)
                }
            ]
        });
    }

    public async getTop(context: GuildCommandContext): Promise<MessageEmbedOptions> {
        const votebans = await context.database.guilds.getVoteBans(context.channel.guild.id);

        const entries = votebans === undefined ? [] : Object.entries(votebans)
            .map(e => [e[0], e[1]?.length ?? 0] as const)
            .filter(e => e[1] > 0)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map((e, i) => `**${i + 1}.** <@${e[0]}> - ${e[1]} ${p(e[1], 'signature')}`);

        return {
            author: context.util.embedifyAuthor(context.channel.guild),
            title: this.info('Top 10 Vote bans'),
            description: entries.length === 0 ? 'No petitions have been signed yet!' : entries.join('\n')
        };
    }

    public async getVotes(context: GuildCommandContext, user: GuildMember): Promise<MessageEmbedOptions> {
        const votes = await context.database.guilds.getVoteBans(context.channel.guild.id, user.id) ?? [];

        return {
            author: context.util.embedifyAuthor(user),
            color: user.roles.color?.color,
            title: this.info('Vote ban signatures'),
            description: votes.length === 0 ? `No one has voted to ban ${user.toString()} yet.`
                : votes.length > 20 ? `${votes.slice(0, 15).map(v => `<@${v}>`).join('\n')}\n... and ${votes.length - 15} more`
                    : votes.map(v => `<@${v}>`).join('\n')
        };
    }

    public async sign(context: GuildCommandContext, user: GuildMember, reason: string | undefined): Promise<string> {
        if (await context.database.guilds.hasVoteBanned(context.channel.guild.id, user.id, context.author.id))
            return this.error(`I know youre eager, but you have already signed the petition to ban ${user.toString()}!`);

        const newTotal = await context.database.guilds.addVoteBan(context.channel.guild.id, user.id, context.author.id);
        if (newTotal === false)
            return this.error('Seems the petitions office didnt like that one! Please try again');

        return this.success(`${context.author.toString()} has signed to ban ${user.toString()}! ` +
            `A total of **${newTotal} ${p(newTotal, 'person** has', 'people** have')} signed the petition now.` +
            (reason !== undefined ? `\n**Reason**: ${reason}` : ''));
    }

    public async unsign(context: GuildCommandContext, user: GuildMember): Promise<string> {
        if (!await context.database.guilds.hasVoteBanned(context.channel.guild.id, user.id, context.author.id))
            return this.error(`Thats very kind of you, but you havent even signed to ban ${user.toString()} yet!`);

        const newTotal = await context.database.guilds.removeVoteBan(context.channel.guild.id, user.id, context.author.id);
        if (newTotal === false)
            return this.error('Seems the petitions office didnt like that one! Please try again');

        return this.success(`${context.author.toString()} reconsidered and forgiven ${user.toString()}! ` +
            `A total of **${newTotal} ${p(newTotal, 'person** has', 'people** have')} signed the petition now.`);
    }
}
