import { GuildMessage } from 'eris';
import { RollingArray } from './globalCore';

export class MessageIdQueue {
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #messageQueue: Record<string, RollingArray<string> | undefined>;

    public constructor(
        public readonly maxSize: number = 100
    ) {
        this.#messageQueue = {};
    }

    public push(message: GuildMessage): void;
    public push(guildId: string, messageId: string): void
    public push(...args: [guildId: string, messageId: string] | [message: GuildMessage]): void {
        const [guildId, messageId] = args.length === 1 ? [args[0].channel.guild.id, args[0].id] : args;
        const messageQueue = this.#messageQueue[guildId] ??= new RollingArray(this.maxSize);
        messageQueue.push(messageId);
    }

    public has(guildId: string, messageId: string): boolean {
        return this.#messageQueue[guildId]?.includes(messageId)
            ?? false;
    }
}
