import { RollingArray } from '@core/RollingArray';

export class MessageIdQueue {
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

    public remove(guildId: string, messageId: string): boolean {
        const messageQueue = this.#messageQueue[guildId];
        if (messageQueue === undefined)
            return false;

        let success = false;
        for (let i = messageQueue.length - 1; i >= 0; i--) {
            if (messageQueue[i] === messageId) {
                messageQueue.splice(i, 1);
                success = true;
            }
        }
        return success;

    }
}
