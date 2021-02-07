
export class MessageIdQueue {
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #messageQueue: Map<string, string[]>;

    public constructor(
        public readonly maxSize: number = 100
    ) {
        this.#messageQueue = new Map();
    }

    public push(guildId: string, messageId: string): void {
        let messageQueue = this.#messageQueue.get(guildId);
        if (!messageQueue)
            this.#messageQueue.set(guildId, messageQueue = []);

        messageQueue.push(messageId);
        while (messageQueue.length > this.maxSize)
            messageQueue.shift();
    }

    public has(guildId: string, messageId: string): boolean {
        return this.#messageQueue.get(guildId)?.includes(messageId)
            ?? false;
    }
}
