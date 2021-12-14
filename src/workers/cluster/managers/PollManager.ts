import { Cluster } from '@cluster';
import { PollResponse } from '@cluster/types';
import { parse } from '@cluster/utils';
import { PollEventOptions } from '@core/types';
import { pluralise as p } from '@core/utils';
import { KnownGuildTextableChannel, User } from 'eris';
import moment, { Duration } from 'moment-timezone';

export class PollManager {
    public constructor(
        private readonly cluster: Cluster
    ) {
    }

    public async createPoll(
        channel: KnownGuildTextableChannel,
        author: User,
        emojis: string[],
        title: string,
        description: string | undefined,
        colour: number,
        duration: Duration,
        announce: boolean
    ): Promise<PollResponse> {
        if (duration.asMilliseconds() === 0)
            return { state: 'TOO_SHORT' };

        if (emojis.length === 0)
            return { state: 'OPTIONS_EMPTY' };

        const emoji = [];
        const unknownOptions = [];
        for (const e of emojis) {
            const parsed = parse.emoji(e, true);
            if (parsed.length === 0)
                unknownOptions.push(e);
            emoji.push(...parsed);
        }

        if (unknownOptions.length > 0)
            return { state: 'OPTIONS_INVALID', failedReactions: unknownOptions };

        const endTime = moment().add(duration);

        if (announce)
            return { state: 'NO_ANNOUNCE_PERMS' }; // TODO Use an announcement manager

        const poll = await this.cluster.util.send(channel, {
            embeds: [
                {
                    author: {
                        icon_url: this.cluster.util.embedifyAuthor(author).icon_url,
                        name: title
                    },
                    description: description,
                    footer: { text: 'The poll will end' },
                    timestamp: endTime.toDate(),
                    color: colour
                }
            ]
        });

        if (poll === undefined)
            return { state: 'FAILED_SEND' };

        const reactions = await this.cluster.util.addReactions(poll, emoji);

        await this.cluster.timeouts.insert('poll', {
            endtime: endTime.valueOf(),
            source: channel.guild.id,
            channel: channel.id,
            guild: channel.guild.id,
            user: author.id,
            msg: poll.id,
            content: title,
            color: colour,
            strict: emoji
        });

        return { state: 'SUCCESS', message: poll, failedReactions: reactions.failed };
    }

    public async pollExpired(options: PollEventOptions): Promise<void> {
        const message = await this.cluster.util.getMessage(options.channel, options.msg, true);
        if (message === undefined)
            return;

        let author = message.embeds[0]?.author ?? undefined;
        if (author === undefined) {
            const user = await this.cluster.util.getMember(options.guild, options.user)
                ?? await this.cluster.util.getUser(options.user)
                ?? await this.cluster.database.users.get(options.user);
            if (user === undefined)
                return;
            author = {
                icon_url: this.cluster.util.embedifyAuthor(user).icon_url,
                name: options.content
            };
        }

        const results = {} as Record<string, number>;
        for (const [key, reaction] of Object.entries(message.reactions)) {
            if (options.strict?.includes(key) === false)
                continue;

            results[key] = reaction.count - +reaction.me;
        }

        const bestCount = Math.max(0, ...Object.values(results));
        const voteCount = Object.values(results).reduce((p, c) => p + c, 0);
        const winners = Object.entries(results).filter(e => e[1] === bestCount).map(e => e[0]);

        const resultStr = bestCount === 0
            ? 'No one voted, how sad 😦'
            : winners.length > 1
                ? `It was a tie between these choices at **${bestCount}** ${p(bestCount, 'vote')} each:\n\n${winners.join('')}`
                : `At **${bestCount}** ${p(bestCount, 'vote')}, the winner is:\n\n${winners.join('')}`;

        await this.cluster.util.send(message, {
            embeds: [
                {
                    author: author,
                    description: `The results are in! A total of **${voteCount}** ${p(voteCount, 'vote was', 'votes were')} collected!\n\n${resultStr}`,
                    color: options.color
                }
            ]
        });
    }
}