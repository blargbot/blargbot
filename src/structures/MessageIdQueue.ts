import { RollingArray } from './RollingArray';

export class MessageIdQueue {
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #messageQueue: Record<string, RollingArray<string> | undefined>;

    public constructor(
        public readonly maxSize: number = 100
    ) {
        this.#messageQueue = {};
    }

    public push(guildId: string, messageId: string): void {
        const messageQueue = this.#messageQueue[guildId] ??= new RollingArray(this.maxSize);
        messageQueue.push(messageId);
    }

    public has(guildId: string, messageId: string): boolean {
        return this.#messageQueue[guildId]?.includes(messageId)
            ?? false;
    }
}

