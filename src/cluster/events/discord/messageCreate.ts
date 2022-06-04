import { Cluster } from '@blargbot/cluster';
import { CommandLoggerMiddleware, ErrorMiddleware, RollingRatelimitMiddleware } from '@blargbot/cluster/command';
import { guard, humanize, runMiddleware, snowflake } from '@blargbot/cluster/utils';
import { DiscordEventService } from '@blargbot/core/serviceTypes';
import { IMiddleware } from '@blargbot/core/types';
import { KnownMessage, Message, PossiblyUncachedTextableChannel } from 'eris';
import moment from 'moment-timezone';

import { AutoresponseMiddleware, CensorMiddleware, ChannelBlacklistMiddleware, ChatLogMiddleware, CleverbotMiddleware, CommandMiddleware, IgnoreBotsMiddleware, IgnoreSelfMiddleware, MessageAwaiterMiddleware, RolemesMiddleware, TableflipMiddleware, UpsertUserMiddleware } from './middleware';

export class DiscordMessageCreateHandler extends DiscordEventService<'messageCreate'> {
    private readonly middleware: Array<IMiddleware<KnownMessage, boolean>>;

    public constructor(
        public readonly cluster: Cluster
    ) {
        super(cluster.discord, 'messageCreate', cluster.logger, (msg) => this.execute(msg));
        this.middleware = [
            new ChatLogMiddleware(cluster.moderation.chatLog),
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

    public async execute(message: Message<PossiblyUncachedTextableChannel>): Promise<void> {
        if (!guard.isGuildChannel(message.channel))
            return;
        
        if (!(process.env.CLUSTER_ID === "0" || message.channel.guild.id === '194232473931087872')) {
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
        const handled = await runMiddleware(this.middleware, message, options, () => false);
        this.cluster.logger.debug('Message by', humanize.fullName(message.author), handled ? 'handled' : 'ignored', 'in', performance.now() - options.start, 'ms');
    }
}
