import { Cluster, ClusterUtilities } from '@cluster';
import { BBTagEngine } from '@cluster/bbtag';
import { CommandResult } from '@cluster/types';
import { humanize } from '@cluster/utils';
import { Database } from '@core/database';
import { Logger } from '@core/Logger';
import { DMContext, SendContext, SendPayload } from '@core/types';
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

    public async send(content: CommandResult): Promise<Message | undefined>
    public async send(context: SendContext, content: CommandResult): Promise<Message | undefined>
    public async send(...args: [CommandResult] | [SendContext, CommandResult]): Promise<Message | undefined> {
        const [context, content] = args.length === 1 ? [this.message, toSendContent(args[0])] : [args[0], toSendContent(args[1])];
        if (content === undefined)
            return undefined;
        return await this.cluster.util.send(context, content);
    }

    public async reply(content: CommandResult): Promise<Message | undefined> {
        content = toSendContent(content);
        if (content === undefined)
            return undefined;
        return await this.cluster.util.send(this.message, content);
    }

    public async sendDM(content: CommandResult): Promise<Message | undefined>
    public async sendDM(context: DMContext, content: CommandResult): Promise<Message | undefined>
    public async sendDM(...args: [CommandResult] | [DMContext, CommandResult]): Promise<Message | undefined> {
        const [context, content] = args.length === 1 ? [this.author, toSendContent(args[0])] : [args[0], toSendContent(args[1])];
        if (content === undefined)
            return undefined;
        return await this.cluster.util.sendDM(context, content);
    }
}

function toSendContent(content: CommandResult): SendPayload | undefined {
    switch (typeof content) {
        case 'undefined':
            return undefined;
        case 'object':
            if ('data' in content)
                return { name: content.fileName, attachment: content.data };
        // fallthrough
        default:
            return content;
    }
}
