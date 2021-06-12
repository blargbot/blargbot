import { Client as ErisClient } from 'eris';
import { BaseService } from './BaseService';

export abstract class DiscordEventService extends BaseService {
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #execute: (...args: unknown[]) => void;
    public readonly type: string;

    protected constructor(
        public readonly discord: ErisClient,
        public readonly event: string,
        public readonly logger: CatLogger
    ) {
        super();
        this.type = `DiscordEvent:${this.event}`;
        const execute = async (...args: unknown[]): Promise<void> => {
            try {
                await this.execute(...args);
            } catch (err) {
                this.logger.error(`Discord event handler ${this.name} threw an error:`, err);
            }
        };

        this.#execute = (...args: unknown[]) => void execute(...args);
    }

    protected abstract execute(...args: unknown[]): Promise<void> | void;

    public start(): void {
        this.discord.on(this.event, this.#execute);
    }

    public stop(): void {
        this.discord.off(this.event, this.#execute);
    }
}
