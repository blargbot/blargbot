import { BaseService } from '@blargbot/core/serviceTypes';
import { EventOptionsTypeMap, StoredEvent } from '@blargbot/domain/models';
import { Logger } from '@blargbot/logger';

import { TimeoutManager } from '../managers/TimeoutManager';

export abstract class TimeoutEventService<TEvent extends keyof EventOptionsTypeMap> extends BaseService {
    readonly #execute: (event: StoredEvent<TEvent>) => void;
    public readonly type: string;

    protected constructor(
        public readonly timeouts: TimeoutManager,
        public readonly event: TEvent,
        public readonly logger: Logger
    ) {
        super();
        this.type = `timeout:${this.event}`;
        this.#execute = this.makeSafeCaller(this.execute.bind(this), this.logger, `Timeout event handler`);
    }

    public abstract execute(event: StoredEvent<TEvent>): Promise<void> | void;

    public start(): void {
        this.timeouts.on(this.event, this.#execute);
    }

    public stop(): void {
        this.timeouts.off(this.event, this.#execute);
    }

}
