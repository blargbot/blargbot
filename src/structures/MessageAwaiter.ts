import { ChannelMessage, Message } from 'eris';
import { EventEmitter } from 'eventemitter3';

export class MessageAwaiter {
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #events: EventEmitter;

    public constructor(
        public readonly logger: CatLogger
    ) {
        this.#events = new EventEmitter();
    }

    public emit(message: ChannelMessage): boolean {
        return this.#events.emit(message.channel.id, message);
    }

    public async wait(channels: string[], users: string[] | null, timeoutMS: number, filter?: (message: Message) => boolean): Promise<Message | null> {
        this.logger.debug(`awaiting message | channels: [${channels}] users: [${users}] timeout: ${timeoutMS}`);

        return await new Promise<Message | null>(resolve => {
            const timeout = setTimeout(() => {
                resolve(null);
                for (const channel of channels)
                    this.#events.off(channel, handler);
            }, timeoutMS);

            const _filter = buildFilter(users, filter);
            const handler = (message: Message): void => {
                if (!_filter(message))
                    return;

                resolve(message);
                clearTimeout(timeout);
                for (const channel of channels)
                    this.#events.off(channel, handler);
            };

            for (const channel of channels)
                this.#events.on(channel, handler);
        });
    }
}

function buildFilter(users: string[] | null, filter?: (message: Message) => boolean): (message: Message) => boolean {
    if (users === null || users.length === 0)
        return filter ?? (() => true);

    if (users.length === 1) {
        const user = users[0];
        if (filter === undefined)
            return m => m.author.id === user;
        return m => m.author.id == user && filter(m);
    }

    const userSet = new Set(users);
    if (filter === undefined)
        return m => userSet.has(m.author.id);
    return m => userSet.has(m.author.id) && filter(m);
}