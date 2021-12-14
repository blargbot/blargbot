import { Cluster } from '@cluster';
import { CommandLoggerMiddleware, ErrorMiddleware, RollingRatelimitMiddleware, SendTypingMiddleware } from '@cluster/command';
import { guard, humanize, runMiddleware } from '@cluster/utils';
import { DiscordEventService } from '@core/serviceTypes';
import { IMiddleware } from '@core/types';
import { KnownMessage, Message, PossiblyUncachedTextableChannel } from 'eris';
import moment from 'moment';

import { AutoresponseMiddleware, CensorMiddleware, ChannelBlacklistMiddleware, ChatlogMiddleware, CleverbotMiddleware, CommandMiddleware, IgnoreBotsMiddleware, IgnoreSelfMiddleware, MessageAwaiterMiddleware, RolemesMiddleware, TableflipMiddleware, UpsertUserMiddleware } from './middleware';

export class DiscordMessageCreateHandler extends DiscordEventService<'messageCreate'> {
    private readonly middleware: Array<IMiddleware<KnownMessage, boolean>>;

    public constructor(
        public readonly cluster: Cluster
    ) {
        super(cluster.discord, 'messageCreate', cluster.logger, (msg) => this.execute(msg));
        this.middleware = [
            new IgnoreSelfMiddleware(cluster.logger, cluster.discord),
            new UpsertUserMiddleware(cluster.database.users),
            new ChatlogMiddleware(cluster.moderation.chatLog),
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
                new CommandLoggerMiddleware(),
                new SendTypingMiddleware()
            ]),
            new CleverbotMiddleware(cluster.util)
        ];
    }

    public async execute(message: Message<PossiblyUncachedTextableChannel>): Promise<void> {
        if (!guard.isWellKnownMessage(message))
            return;

        const options = Object.seal({
            id: message.id,
            logger: this.logger,
            start: performance.now()
        });
        const handled = await runMiddleware(this.middleware, message, options, () => false);
        this.cluster.logger.debug('Message by', humanize.fullName(message.author), handled ? 'handled' : 'ignored', 'in', performance.now() - options.start, 'ms');
    }
}