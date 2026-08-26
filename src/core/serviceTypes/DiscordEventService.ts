import type { Logger } from '@blargbot/logger';
import type * as eris from 'eris';

import { BaseService } from './BaseService.js';

export abstract class DiscordEventService<T extends keyof eris.ClientEvents> extends BaseService {
    readonly #execute: (...args: eris.ClientEvents[T]) => void;
    public readonly type: string;

    protected constructor(
        public readonly discord: eris.Client,
        public readonly event: T,
        public readonly logger: Logger,
        handler: (...args: eris.ClientEvents[T]) => Awaitable<void>
    ) {
        super();
        this.type = `DiscordEvent:${this.event}`;
        this.#execute = this.makeSafeCaller(handler, logger, 'Discord event handler');
    }

    public start(): void {
        this.discord.on<T>(this.event, this.#execute);
    }

    public stop(): void {
        this.discord.off<T>(this.event, this.#execute);
    }
}
