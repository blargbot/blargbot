import { Logger } from '@core/Logger';
import { Client as Discord, ClientEvents } from 'discord.js';

import { BaseService } from './BaseService';

export abstract class DiscordEventService<T extends keyof ClientEvents> extends BaseService {
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #execute: (...args: ClientEvents[T]) => void;
    public readonly type: string;

    protected constructor(
        public readonly discord: Discord<true>,
        public readonly event: T,
        public readonly logger: Logger
    ) {
        super();
        this.type = `DiscordEvent:${this.event}`;
        this.#execute = async (...args: ClientEvents[T]): Promise<void> => {
            try {
                this.logger.debug(`Executing Discord event handler ${this.name}`);
                await this.execute(...args);
            } catch (err: unknown) {
                this.logger.error(`Discord event handler ${this.name} threw an error:`, err);
            }
        };
    }

    public abstract execute(...args: ClientEvents[T]): Promise<void> | void;

    public start(): void {
        this.discord.on<T>(this.event, this.#execute);
    }

    public stop(): void {
        this.discord.off<T>(this.event, this.#execute);
    }
}
