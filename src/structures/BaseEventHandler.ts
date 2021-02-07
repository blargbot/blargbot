import { EventEmitter as EventEmitter3 } from 'eventemitter3';
import { EventEmitter as NodeEventEmitter } from 'events';

export abstract class BaseEventHandler<TArgs extends unknown[] = unknown[]> {
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    #handler?: (...args: unknown[]) => void;
    public get name(): string { return this.constructor.name; }

    protected constructor(
        protected readonly events: EventEmitter3 | NodeEventEmitter,
        public readonly type: string,
        public readonly logger: CatLogger) {
    }

    protected abstract handle(...args: TArgs): Promise<void> | void;

    public install(): void {
        if (this.#handler !== undefined)
            throw new Error('Already installed!');

        this.#handler = (...args: unknown[]) => this.handle(...<TArgs>args);
        this.events.on(this.type, this.#handler);
    }

    public uninstall(): void {
        if (this.#handler === undefined)
            return;

        this.events.off(this.type, this.#handler);
        this.#handler = undefined;
    }
}


