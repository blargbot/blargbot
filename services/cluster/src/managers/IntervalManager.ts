import { randomUUID } from 'node:crypto';

import { sleep } from '@blargbot/async-tools';
import type { ExecutionResult } from '@blargbot/bbtag';
import type { Cluster } from '@blargbot/cluster';
import { guard } from '@blargbot/cluster/utils/index.js';
import type { GuildTriggerTag } from '@blargbot/domain/models/index.js';
import type * as Eris from 'eris';
import moment from 'moment-timezone';

export class IntervalManager {
    readonly #cluster: Cluster;

    public constructor(
        cluster: Cluster,
        public readonly timeLimit: moment.Duration
    ) {
        this.#cluster = cluster;
    }

    public async invokeAll(): Promise<void> {
        const nonce = Math.floor(Math.random() * 0xffffffff).toString(16).padStart(8, '0').toUpperCase();

        const intervals = (await this.#cluster.database.guilds.getIntervals())
            .map(i => ({ guild: this.#cluster.discord.guilds.get(i.guildId), interval: i.interval }))
            .filter((i): i is { guild: Eris.Guild; interval: GuildTriggerTag; } => i.guild !== undefined);

        this.#cluster.logger.info(`[${nonce}] Running intervals on ${intervals.length} guilds`);

        const resolutions = await Promise.all(intervals.map(async ({ interval, guild }) => {
            this.#cluster.logger.debug(`[${nonce}] Performing interval on ${guild.id}`);
            const result = await this.#cluster.intervals.invoke(guild, interval);
            return { result: typeof result === 'string' ? result : 'SUCCESS' as const, guild: guild.id };
        }));

        this.#cluster.logger.log(resolutions);

        const { success, failed, tooLong } = resolutions.reduce((p, c) => {
            switch (c.result) {
                case 'TOO_LONG':
                    p.tooLong.push(c.guild);
                    break;
                case 'FAILED':
                    p.failed.push(c.guild);
                    break;
                case 'SUCCESS':
                    p.success.push(c.guild);
                    break;
            }
            return p;
        }, { success: [] as string[], failed: [] as string[], tooLong: [] as string[] });

        this.#cluster.logger.info(`[${nonce}] Intervals complete. ${success.length} success | ${failed.length} fail | ${tooLong.length} unresolved`);
        if (tooLong.length > 0) {
            this.#cluster.logger.info(`[${nonce}] Unresolved in:\n${tooLong.join('\n')}`);
        }
    }

    public async invoke(guild: Eris.Guild): Promise<ExecutionResult | 'NO_INTERVAL' | 'TOO_LONG' | 'FAILED' | 'MISSING_AUTHORIZER' | 'MISSING_CHANNEL'>
    public async invoke(guild: Eris.Guild, interval: GuildTriggerTag): Promise<ExecutionResult | 'TOO_LONG' | 'FAILED' | 'MISSING_AUTHORIZER' | 'MISSING_CHANNEL'>
    public async invoke(guild: Eris.Guild, interval?: GuildTriggerTag): Promise<ExecutionResult | 'NO_INTERVAL' | 'TOO_LONG' | 'FAILED' | 'MISSING_AUTHORIZER' | 'MISSING_CHANNEL'> {
        interval ??= await this.#cluster.database.guilds.getInterval(guild.id);
        if (interval === undefined)
            return 'NO_INTERVAL';

        const id = interval.authorizer ?? interval.author;
        const member = await this.#cluster.util.getMember(guild, id ?? '');
        if (member === undefined)
            return 'MISSING_AUTHORIZER';
        const channel = guild.channels.find(guard.isTextableChannel);
        if (channel === undefined)
            return 'MISSING_CHANNEL';

        return await Promise.race([
            this.#invoke(member, channel, interval),
            sleep(this.timeLimit.asMilliseconds(), 'TOO_LONG' as const)
        ]);
    }

    async #invoke(member: Eris.Member, channel: Eris.KnownGuildTextableChannel, interval: GuildTriggerTag): Promise<ExecutionResult | 'FAILED'> {
        try {
            const result = await this.#cluster.bbtag.execute(interval.content, {
                message: {
                    channel: channel,
                    author: member.user,
                    member: member,
                    createdAt: moment.now(),
                    attachments: [],
                    embeds: [],
                    content: '',
                    id: randomUUID()
                } as never,
                limit: 'customCommandLimit',
                inputRaw: '',
                isCC: true,
                rootTagName: '_interval',
                authorId: interval.author ?? undefined,
                authorizerId: interval.authorizer ?? undefined,
                silent: true
            });
            this.#cluster.logger.log('Interval on guild', member.guild.id, 'executed in', result.duration.total);
            return result;
        } catch (err: unknown) {
            this.#cluster.logger.error('Issue with interval:', member.guild, err);
            return 'FAILED';
        }
    }
}
