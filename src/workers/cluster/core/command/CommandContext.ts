import { Channel, Textable, User, Message, MessageFile, AnyMessage, Client as ErisClient } from 'eris';
import { Cluster } from '../../Cluster';
import { ClusterUtilities } from '../../ClusterUtilities';
import { BBTagEngine } from '../bbtag';
import { Database, humanize, SendContext, SendPayload, Logger } from '../globalCore';

export class CommandContext<TChannel extends Channel = Channel> {
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #argRanges: Array<{ start: number; end: number; }>;
    public readonly commandText: string;
    public readonly commandName: string;
    public readonly argsString: string;
    public readonly args: string[];

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
        this.#argRanges = [...humanize.smartSplitRanges(this.argsString)];
        this.args = humanize.smartSplit(this.argsString);
    }

    public argRange(start: number, raw?: false): string[];
    public argRange(start: number, raw: true): string;
    public argRange(start: number, raw: boolean): string | string[];
    public argRange(start: number, end: number, raw?: false): string[];
    public argRange(start: number, end: number, raw: true): string;
    public argRange(start: number, end: number, raw: boolean): string | string[];
    public argRange(...args:
        | [start: number, raw?: boolean]
        | [start: number, end: number, raw?: boolean]
    ): string | string[] {
        const [start, end, raw] = splitArgRangeArgs(args);
        if (this.args.length <= start)
            return raw ? '' : [];

        if (raw) {
            const istart = this.#argRanges[start].start;
            const iend = this.#argRanges[end].end;
            return this.argsString.slice(istart, iend + 1);
        }

        return this.args.slice(start, end);
    }

    public async reply(content: SendPayload | undefined, files?: MessageFile | MessageFile[]): Promise<AnyMessage | undefined> {
        return await this.cluster.util.send(this.message, content, files);
    }

    public async send(context: SendContext, content: SendPayload | undefined, files?: MessageFile | MessageFile[]): Promise<AnyMessage | undefined> {
        return await this.cluster.util.send(context, content, files);
    }
}

function splitArgRangeArgs(args:
    | [start: number, raw?: boolean]
    | [start: number, end: number, raw?: boolean]
): [start: number, end: number, raw: boolean] {
    switch (args.length) {
        case 1: return [args[0], args[0] + 1, false];
        case 3: return [args[0], args[1], args[2] ?? false];
        case 2: switch (typeof args[1]) {
            case 'number': return [args[0], args[1], false];
            case 'undefined': return [args[0], args[0] + 1, false];
            case 'boolean': return [args[0], args[0] + 1, args[1]];
        }
    }
}
