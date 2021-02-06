
export class MessageIdQueue {
    #messageQueue: Map<string, string[]>;
    constructor(
        public readonly maxSize: number = 100
    ) {
        this.#messageQueue = new Map();
    }

    push(guildId: string, messageId: string) {
        let messageQueue = this.#messageQueue.get(guildId);
        if (!messageQueue)
            this.#messageQueue.set(guildId, messageQueue = []);

        messageQueue.push(messageId);
        while (messageQueue.length > this.maxSize)
            messageQueue.shift();
    }

    has(guildId: string, messageId: string) {
        return this.#messageQueue.get(guildId)?.includes(messageId)
            ?? false;
    }
}
