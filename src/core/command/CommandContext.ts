import { Channel, Textable, User, Message } from 'eris';
import { Cluster } from '../../cluster';
import { humanize } from '../../utils';

export class CommandContext<TChannel extends Channel = Channel> {
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #argRanges: Array<{ start: number; end: number; }>;
    public readonly commandText: string;
    public readonly commandName: string;
    public readonly argsString: string;
    public readonly args: string[];

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
    public argRange(start: number, arg2?: number | boolean, arg3?: boolean): string | string[] {
        const [end, raw] =
            arg2 === undefined ? [this.args.length - 1, false]
                : typeof arg2 === 'number' ? [arg2, arg3 ?? false]
                    : [this.args.length - 1, arg2];

        if (this.args.length <= start)
            return raw ? '' : [];

        if (raw) {
            const istart = this.#argRanges[start].start;
            const iend = this.#argRanges[end].end;
            return this.argsString.slice(istart, iend + 1);
        }

        return this.args.slice(start, end);
    }
}