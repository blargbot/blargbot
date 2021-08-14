import { Cluster, ClusterUtilities } from '@cluster';
import { BBTagEngine } from '@cluster/bbtag';
import { humanize } from '@cluster/utils';
import { Database } from '@core/database';
import { Logger } from '@core/Logger';
import { SendContext, SendPayload } from '@core/types';
import { Client as Discord, Message, TextBasedChannels, User } from 'discord.js';

export class CommandContext<TChannel extends TextBasedChannels = TextBasedChannels> {
    public readonly commandText: string;
    public readonly commandName: string;
    public readonly argsString: string;

    public get logger(): Logger { return this.cluster.logger; }
    public get bbtag(): BBTagEngine { return this.cluster.bbtag; }
    public get util(): ClusterUtilities { return this.cluster.util; }
    public get config(): Configuration { return this.cluster.config; }
    public get discord(): Discord<true> { return this.cluster.discord; }
    public get database(): Database { return this.cluster.database; }
    public get channel(): TChannel { return this.message.channel; }
    public get author(): User { return this.message.author; }
    public get id(): string { return this.message.id; }
    public get timestamp(): number { return this.message.createdTimestamp; }

    public constructor(
        public readonly cluster: Cluster,
        public readonly message: Message & { channel: TChannel; },
        public readonly prefix: string
    ) {
        this.commandText = message.content.slice(prefix.length);
        const parts = humanize.smartSplit(this.commandText, 2);
        this.commandName = parts[0].toLowerCase();
        this.argsString = parts[1] ?? '';
    }

    public async reply(content: SendPayload): Promise<Message & { channel: TChannel; } | undefined> {
        return <Message & { channel: TChannel; }>await this.cluster.util.send(this.message, content);
    }

    public async send(context: SendContext, content: SendPayload): Promise<Message | undefined> {
        return await this.cluster.util.send(context, content);
    }
}
