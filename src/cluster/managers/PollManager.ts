import { Cluster } from '@blargbot/cluster';
import { PollResponse } from '@blargbot/cluster/types';
import { Emote } from '@blargbot/core/Emote';
import { FormattableMessageContent } from '@blargbot/core/FormattableMessageContent';
import { literal } from '@blargbot/domain/messages/types';
import { PollEventOptions } from '@blargbot/domain/models';
import { AllowedMentions, KnownGuildTextableChannel, User } from 'eris';
import moment, { Duration } from 'moment-timezone';

import templates from '../text';

export class PollManager {
    readonly #cluster: Cluster;

    public constructor(
        cluster: Cluster
    ) {
        this.#cluster = cluster;
    }

    public async createPoll(
        channel: KnownGuildTextableChannel,
        author: User,
        emojis: Emote[],
        title: string,
        description: string | undefined,
        colour: number,
        duration: Duration,
        announce: boolean
    ): Promise<PollResponse> {
        if (duration.asMilliseconds() === 0)
            return { state: `TOO_SHORT` };

        if (emojis.length === 0)
            return { state: `OPTIONS_EMPTY` };

        const endTime = moment().add(duration);
        let content: string | undefined = undefined;
        const allowedMentions: AllowedMentions = {};

        if (announce) {
            const result = await this.#cluster.announcements.loadConfig(channel.guild, author, channel);
            switch (result.state) {
                case `ChannelInvalid`: return { state: `ANNOUNCE_INVALID` };
                case `ChannelNotFound`: return { state: `ANNOUNCE_INVALID` };
                case `ChannelNotInGuild`: return { state: `ANNOUNCE_INVALID` };
                case `NotAllowed`: return { state: `NO_ANNOUNCE_PERMS` };
                case `RoleNotFound`: return { state: `ANNOUNCE_INVALID` };
                case `TimedOut`: return { state: `FAILED_SEND` };
            }
            channel = result.detail.channel;
            content = result.detail.role.mention;
            if (result.detail.role.id === result.detail.role.guild.id)
                allowedMentions.everyone = true;
            else
                allowedMentions.roles = [result.detail.role.id];
        }

        const poll = await this.#cluster.util.send(channel, new FormattableMessageContent({
            content: literal(content),
            allowedMentions,
            embeds: [
                {
                    author: {
                        icon_url: this.#cluster.util.embedifyAuthor(author).icon_url,
                        name: literal(title)
                    },
                    description: literal(description),
                    footer: { text: templates.poll.embed.footer.text },
                    timestamp: endTime.toDate(),
                    color: colour
                }
            ]
        }));

        if (poll === undefined)
            return { state: `FAILED_SEND` };

        const reactions = await this.#cluster.util.addReactions(poll, emojis);

        await this.#cluster.timeouts.insert(`poll`, {
            endtime: endTime.valueOf(),
            source: channel.guild.id,
            channel: channel.id,
            guild: channel.guild.id,
            user: author.id,
            msg: poll.id,
            content: title,
            color: colour,
            strict: emojis.map(m => m.toString())
        });

        return { state: `SUCCESS`, message: poll, failedReactions: reactions.failed.map(m => m.toString()) };
    }

    public async pollExpired(options: PollEventOptions): Promise<void> {
        const message = await this.#cluster.util.getMessage(options.channel, options.msg, true);
        if (message === undefined)
            return;

        let author = message.embeds[0]?.author ?? undefined;
        if (author === undefined) {
            const user = await this.#cluster.util.getMember(options.guild, options.user)
                ?? await this.#cluster.util.getUser(options.user)
                ?? await this.#cluster.database.users.get(options.user);
            if (user === undefined)
                return;
            author = {
                icon_url: this.#cluster.util.embedifyAuthor(user).icon_url,
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

        await this.#cluster.util.reply(message, new FormattableMessageContent({
            embeds: [
                {
                    author: {
                        ...author,
                        name: literal(author.name)
                    },
                    description: bestCount === 0 ? templates.poll.success.noVotes({ total: voteCount })
                        : winners.length > 1 ? templates.poll.success.tie({ total: voteCount, count: bestCount, winners })
                            : templates.poll.success.single({ total: voteCount, count: bestCount, winner: winners[0] }),
                    color: options.color
                }
            ]
        }));
    }
}
