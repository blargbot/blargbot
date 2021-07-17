import { AnyMessage, Emoji, User } from 'eris';
import EventEmitter from 'eventemitter3';
import { Logger } from '@cluster/core';

export class ReactionAwaiter {
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #events: EventEmitter;

    public constructor(
        private readonly logger: Logger
    ) {
        this.#events = new EventEmitter();
    }

    public emit(message: AnyMessage, emoji: Emoji, user: User): boolean {
        const result = this.#events.emit(message.id, emoji, user);
        return this.#events.emit('any', message, emoji, user) || result;
    }

    public once(messageId: string, handler: (emoji: Emoji, user: User) => void): this {
        this.#events.once(messageId, handler);
        return this;
    }

    public on(messageId: string, handler: (emoji: Emoji, user: User) => void): this {
        this.#events.on(messageId, handler);
        return this;
    }

    public off(messageId: string, handler: (emoji: Emoji, user: User) => void): this {
        this.#events.on(messageId, handler);
        return this;
    }

    public onAny(handler: (message: AnyMessage, emoji: Emoji, user: User) => void): this {
        this.#events.on('any', handler);
        return this;
    }

    public offAny(handler: (message: AnyMessage, emoji: Emoji, user: User) => void): this {
        this.#events.off('any', handler);
        return this;
    }
    public async wait(messageId: string, users: string[] | undefined, timeoutMS: number, filter?: (emoji: Emoji, user: User) => boolean): Promise<{ emoji: Emoji; user: User; } | undefined> {
        this.logger.debug(`awaiting reaction | message: [${messageId}] users: [${users?.join(',') ?? ''}] timeout: ${timeoutMS}`);

        return await new Promise<{ emoji: Emoji; user: User; } | undefined>(resolve => {
            const timeout = setTimeout(() => {
                resolve(undefined);
                this.off(messageId, handler);
            }, timeoutMS);

            const _filter = buildFilter(users, filter);
            const handler = (emoji: Emoji, user: User): void => {
                if (!_filter(emoji, user))
                    return;

                resolve({ emoji, user });
                clearTimeout(timeout);
                this.off(messageId, handler);
            };

            this.on(messageId, handler);
        });
    }
}

function buildFilter(users: string[] | undefined, filter?: (emoji: Emoji, user: User) => boolean): (emoji: Emoji, user: User) => boolean {
    if (users === undefined || users.length === 0)
        return filter ?? (() => true);

    if (users.length === 1) {
        const user = users[0];
        if (filter === undefined)
            return (_, r) => r.id === user;
        return (e, r) => r.id === user && filter(e, r);
    }

    const userSet = new Set(users);
    if (filter === undefined)
        return (_, r) => userSet.has(r.id);
    return (e, r) => userSet.has(r.id) && filter(e, r);
}
