import { Message } from "eris";
import { EventEmitter } from "eventemitter3";

export class MessageAwaiter {
    readonly #events: EventEmitter;
    constructor() {
        this.#events = new EventEmitter();
    }

    emit(message: Message) {
        this.#events.emit(message.channel.id, message);
    }

    wait(channelId: string, userId: string | null, timeoutMS: number, filter?: (message: Message) => boolean) {
        return new Promise<Message | null>(resolve => {
            const timeout = setTimeout(() => {
                resolve(null);
                this.#events.off(channelId, handler);
            }, timeoutMS);

            const _filter = buildFilter(userId, filter);
            const handler = (message: Message) => {
                if (!_filter(message))
                    return;

                resolve(message);
                this.#events.off(channelId, handler);
                clearTimeout(timeout);
            }
            this.#events.on(channelId, handler);
        });
    }
}

function buildFilter(userId: string | null, filter?: (message: Message) => boolean): (message: Message) => boolean {
    if (userId === null)
        return filter ?? (() => true);

    if (filter === undefined)
        return message => message.author.id === userId;

    return message => message.author.id === userId
        && filter!(message);
}