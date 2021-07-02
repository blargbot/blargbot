import { AnyMessage } from 'eris';
import { EventEmitter } from 'eventemitter3';

export class MessageAwaiter {
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #events: EventEmitter;

    public constructor(
        public readonly logger: CatLogger
    ) {
        this.#events = new EventEmitter();
    }

    public emit(message: AnyMessage): boolean {
        const result = this.#events.emit(message.channel.id, message);
        return this.#events.emit('any', message) || result;
    }

    public once(channelId: string, handler: (message: AnyMessage) => void): this {
        this.#events.once(channelId, handler);
        return this;
    }

    public on(channelId: string, handler: (message: AnyMessage) => void): this {
        this.#events.on(channelId, handler);
        return this;
    }

    public off(channelId: string, handler: (message: AnyMessage) => void): this {
        this.#events.on(channelId, handler);
        return this;
    }

    public onAny(handler: (message: AnyMessage) => void): this {
        this.#events.on('any', handler);
        return this;
    }

    public offAny(handler: (message: AnyMessage) => void): this {
        this.#events.off('any', handler);
        return this;
    }

    public async wait(channels: string[], users: string[] | null, timeoutMS: number, filter?: (message: AnyMessage) => boolean): Promise<AnyMessage | null> {
        this.logger.debug(`awaiting message | channels: [${channels}] users: [${users}] timeout: ${timeoutMS}`);

        return await new Promise<AnyMessage | null>(resolve => {
            const timeout = setTimeout(() => {
                resolve(null);
                for (const channel of channels)
                    this.off(channel, handler);
            }, timeoutMS);

            const _filter = buildFilter(users, filter);
            const handler = (message: AnyMessage): void => {
                if (!_filter(message))
                    return;

                resolve(message);
                clearTimeout(timeout);
                for (const channel of channels)
                    this.off(channel, handler);
            };

            for (const channel of channels)
                this.on(channel, handler);
        });
    }
}

function buildFilter(users: string[] | null, filter?: (message: AnyMessage) => boolean): (message: AnyMessage) => boolean {
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