import { Logger } from '@blargbot/core/Logger';
import { Client as Discord, ClientEvents } from 'eris';

import { BaseService } from './BaseService';

export abstract class DiscordEventService<T extends keyof ClientEvents> extends BaseService {
    readonly #execute: (...args: ClientEvents[T]) => void;
    public readonly type: string;

    protected constructor(
        public readonly discord: Discord,
        public readonly event: T,
        public readonly logger: Logger,
        handler: (...args: ClientEvents[T]) => Awaitable<void>
    ) {
        super();
        this.type = `DiscordEvent:${this.event}`;
        this.#execute = async (...args: ClientEvents[T]): Promise<void> => {
            try {
                this.logger.debug(`Executing Discord event handler ${this.name}`);
                await handler(...args);
            } catch (err: unknown) {
                this.logger.error(`Discord event handler ${this.name} threw an error:`, err);
            }
        };
    }

    public start(): void {
        this.discord.on<T>(this.event, this.#execute);
    }

    public stop(): void {
        this.discord.off<T>(this.event, this.#execute);
    }
}
