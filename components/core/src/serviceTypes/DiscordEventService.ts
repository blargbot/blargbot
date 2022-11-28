import { Logger } from '@blargbot/logger';
import Eris from 'eris';

import { BaseService } from './BaseService';

export abstract class DiscordEventService<T extends keyof Eris.ClientEvents> extends BaseService {
    readonly #execute: (...args: Eris.ClientEvents[T]) => void;
    public readonly type: string;

    protected constructor(
        public readonly discord: Eris.Client,
        public readonly event: T,
        public readonly logger: Logger,
        handler: (...args: Eris.ClientEvents[T]) => Awaitable<void>
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
