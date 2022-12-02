import { RollingArray } from '@blargbot/core/RollingArray.js';

export class MessageIdQueue {
    readonly #messageQueue: Record<string, RollingArray<string> | undefined>;

    public constructor(
        public readonly maxSize: number = 100
    ) {
        this.#messageQueue = {};
    }

    public push(channelId: string, messageId: string): void {
        const messageQueue = this.#messageQueue[channelId] ??= new RollingArray(this.maxSize);
        messageQueue.push(messageId);
    }

    public has(channelId: string, messageId: string): boolean {
        return this.#messageQueue[channelId]?.includes(messageId)
            ?? false;
    }

    public remove(channelId: string, messageId: string): boolean {
        const messageQueue = this.#messageQueue[channelId];
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
