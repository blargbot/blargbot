import { performance } from 'node:perf_hooks';

import type { Cluster } from '@blargbot/cluster';
import { guard, runMiddleware, snowflake } from '@blargbot/cluster/utils/index.js';
import { DiscordEventService } from '@blargbot/core/serviceTypes/index.js';
import type { IMiddleware } from '@blargbot/core/types.js';
import Discord from 'discord-api-types/v9';
import type * as Eris from 'eris';
import moment from 'moment-timezone';

import { CommandLoggerMiddleware, ErrorMiddleware, RollingRatelimitMiddleware } from '../../command/index.js';
import { AutoresponseMiddleware, CensorMiddleware, ChannelBlacklistMiddleware, CleverbotMiddleware, CommandMiddleware, IgnoreBotsMiddleware, IgnoreSelfMiddleware, MessageAwaiterMiddleware, RolemesMiddleware, TableflipMiddleware, UpsertUserMiddleware } from './middleware/index.js';

export class DiscordMessageCreateHandler extends DiscordEventService<'messageCreate'> {
    readonly #middleware: Array<IMiddleware<Eris.KnownMessage, boolean>>;

    public constructor(
        public readonly cluster: Cluster
    ) {
        super(cluster.discord, 'messageCreate', cluster.logger, (msg) => this.execute(msg));
        this.#middleware = [
            new IgnoreSelfMiddleware(cluster.logger, cluster.discord),
            new UpsertUserMiddleware(cluster.database.users),
            new CensorMiddleware(cluster.moderation.censors),
            new ChannelBlacklistMiddleware(cluster.util),
            new RolemesMiddleware(cluster.rolemes),
            new AutoresponseMiddleware(cluster.autoresponses),
            new IgnoreBotsMiddleware(),
            new TableflipMiddleware(cluster.util),
            new MessageAwaiterMiddleware(cluster.awaiter.messages),
            new CommandMiddleware(cluster, [
                new ErrorMiddleware(),
                new RollingRatelimitMiddleware({
                    period: moment.duration(30, 's'),
                    maxCommands: 15,
                    cooldown: moment.duration(60, 's'),
                    penalty: moment.duration(5, 's'),
                    key: ctx => ctx.author.id
                }),
                new CommandLoggerMiddleware()
            ]),
            new CleverbotMiddleware(cluster.util)
        ];
    }

    public async execute(message: Eris.Message<Eris.PossiblyUncachedTextableChannel>): Promise<void> {
        if ((message.flags & Discord.MessageFlags.Loading) !== 0) {
            // Message is a loading message. Ignore this event, it will be re-raised by the update handler later once the message is no longer loading
            return;
        }

        if (guard.isUncached(message.channel)) {
            this.cluster.logger.debug('Got a message in an uncached channel, probably a DM. Resolving it now');
            message.channel = await this.cluster.util.getChannel(message.channel.id) ?? message.channel;
        }
        if (!guard.isWellKnownMessage(message))
            return;

        const options = Object.seal({
            id: snowflake.parse(message.id),
            logger: this.logger,
            start: performance.now()
        });
        const handled = await runMiddleware(this.#middleware, message, options, () => false);
        this.cluster.logger.debug('Message by', `${message.author.username}#${message.author.discriminator}`, handled ? 'handled' : 'ignored', 'in', performance.now() - options.start, 'ms');
    }
}
