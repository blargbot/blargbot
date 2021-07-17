import { Channel, Textable, User, Message, MessageFile, AnyMessage, Client as ErisClient } from 'eris';
import { Cluster } from '../../Cluster';
import { ClusterUtilities } from '../../ClusterUtilities';
import { BBTagEngine } from '../bbtag';
import { Database, humanize, SendContext, SendPayload, Logger } from '@core';

export class CommandContext<TChannel extends Channel = Channel> {
    public readonly commandText: string;
    public readonly commandName: string;
    public readonly argsString: string;

    public get logger(): Logger { return this.cluster.logger; }
    public get bbtag(): BBTagEngine { return this.cluster.bbtag; }
    public get util(): ClusterUtilities { return this.cluster.util; }
    public get config(): Configuration { return this.cluster.config; }
    public get discord(): ErisClient { return this.cluster.discord; }
    public get database(): Database { return this.cluster.database; }
    public get channel(): TChannel & Textable { return this.message.channel; }
    public get author(): User { return this.message.author; }
    public get id(): string { return this.message.id; }
    public get timestamp(): number { return this.message.timestamp; }

    public constructor(
        public readonly cluster: Cluster,
        public readonly message: Message<TChannel & Textable>,
        public readonly prefix: string
    ) {
        this.commandText = message.content.slice(prefix.length);
        const parts = humanize.smartSplit(this.commandText, 2);
        this.commandName = parts[0].toLowerCase();
        this.argsString = parts[1] ?? '';
    }

    public async reply(content: SendPayload | undefined, files?: MessageFile | MessageFile[]): Promise<AnyMessage | undefined> {
        return await this.cluster.util.send(this.message, content, files);
    }

    public async send(context: SendContext, content: SendPayload | undefined, files?: MessageFile | MessageFile[]): Promise<AnyMessage | undefined> {
        return await this.cluster.util.send(context, content, files);
    }
}
