import { Cluster } from '@cluster';
import { humanize } from '@cluster/utils';
import { DiscordEventService } from '@core/serviceTypes';
import { IMiddleware } from '@core/types';
import { Message } from 'discord.js';
import moment from 'moment';

import { AutoresponseMiddleware } from './messageCreate/AutoresponseMiddleware';
import { CensorMiddleware } from './messageCreate/CensorMiddleware';
import { ChannelBlacklistMiddleware } from './messageCreate/ChannelBlacklistMiddleware';
import { ChatlogMiddleware } from './messageCreate/ChatlogMiddleware';
import { CleverbotMiddleware } from './messageCreate/CleverbotMiddleware';
import { CommandMiddleware } from './messageCreate/CommandMiddleware';
import { IgnoreBotsMiddleware } from './messageCreate/IgnoreBotsMiddleware';
import { IgnoreSelfMiddleware } from './messageCreate/IgnoreSelfMiddleware';
import { MessageAwaiterMiddleware } from './messageCreate/MessageAwaiterMiddleware';
import { RolemesMiddleware } from './messageCreate/RolemesMiddleware';
import { TableflipMiddleware } from './messageCreate/TableflipMiddleware';
import { UpsertUserMiddleware } from './messageCreate/UpsertUserMiddleware';

export class DiscordMessageCreateHandler extends DiscordEventService<'messageCreate'> {
    private readonly middleware: Array<IMiddleware<Message, boolean>>;

    public constructor(
        public readonly cluster: Cluster
    ) {
        super(cluster.discord, 'messageCreate', cluster.logger);
        this.middleware = [
            new IgnoreSelfMiddleware(cluster.logger),
            new UpsertUserMiddleware(cluster.database.users),
            new ChatlogMiddleware(cluster.moderation.chatLog),
            new CensorMiddleware(cluster.moderation.censors),
            new ChannelBlacklistMiddleware(cluster.util),
            new RolemesMiddleware(cluster.rolemes),
            new AutoresponseMiddleware(cluster.autoresponses),
            new IgnoreBotsMiddleware(),
            new TableflipMiddleware(cluster.util),
            new MessageAwaiterMiddleware(cluster.await.messages),
            new CommandMiddleware(cluster),
            new CleverbotMiddleware(cluster.util)
        ];
    }

    public async execute(message: Message): Promise<void> {
        const start = moment();
        const runMiddleware = (message: Message, index: number): Awaitable<boolean> => {
            if (index >= this.middleware.length)
                return false;
            return this.middleware[index].execute(message, (msg) => runMiddleware(msg ?? message, index + 1));
        };

        const handled = await runMiddleware(message, 0);
        this.cluster.logger.debug('Message by', humanize.fullName(message.author), handled ? 'handled' : 'ignored', 'in', moment().diff(start), 'ms');
    }
}
