import { Logger } from '@core/Logger';
import { BaseService } from '@core/serviceTypes';
import { EventOptionsTypeMap, StoredEvent } from '@core/types';
import { inspect } from 'util';

import { TimeoutManager } from '../managers/TimeoutManager';

export abstract class TimeoutEventService<TEvent extends keyof EventOptionsTypeMap> extends BaseService {
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #execute: (event: StoredEvent<TEvent>) => void;
    public readonly type: string;

    protected constructor(
        public readonly timeouts: TimeoutManager,
        public readonly event: TEvent,
        public readonly logger: Logger
    ) {
        super();
        this.type = `timeout:${this.event}`;
        const execute = async (event: StoredEvent<TEvent>): Promise<void> => {
            try {
                logger.debug(`Executing Timeout event handler ${this.name}`);
                await this.execute(event);
            } catch (err: unknown) {
                logger.error(`Timeout event handler ${this.name} threw an error: ${inspect(err)}`);
            }
        };
        this.#execute = event => void execute(event);
    }

    public abstract execute(event: StoredEvent<TEvent>): Promise<void> | void;

    public start(): void {
        this.timeouts.on(this.event, this.#execute);
    }

    public stop(): void {
        this.timeouts.off(this.event, this.#execute);
    }

}
