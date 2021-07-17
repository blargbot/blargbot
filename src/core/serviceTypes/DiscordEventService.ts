import { Logger } from '@core/Logger';
import { Client as ErisClient, ClientEventTypes } from 'eris';

import { BaseService } from './BaseService';

export abstract class DiscordEventService<T extends keyof ClientEventTypes> extends BaseService {
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #execute: (...args: ClientEventTypes[T]) => void;
    public readonly type: string;

    protected constructor(
        public readonly discord: ErisClient,
        public readonly event: T,
        public readonly logger: Logger
    ) {
        super();
        this.type = `DiscordEvent:${this.event}`;
        const execute = async (...args: ClientEventTypes[T]): Promise<void> => {
            try {
                await this.execute(...args);
            } catch (err: unknown) {
                this.logger.error(`Discord event handler ${this.name} threw an error:`, err);
            }
        };

        this.#execute = (...args) => void execute(...args);
    }

    protected abstract execute(...args: ClientEventTypes[T]): Promise<void> | void;

    public start(): void {
        this.discord.on<T>(this.event, this.#execute);
    }

    public stop(): void {
        this.discord.off<T>(this.event, this.#execute);
    }
}
