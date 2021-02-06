import { EventEmitter as EventEmitter3 } from 'eventemitter3';
import { EventEmitter as NodeEventEmitter } from 'events';

export abstract class BaseEventHandler {
    #handler?: (...args: any[]) => void
    get name() { return this.constructor.name; }

    protected constructor(
        protected readonly events: EventEmitter3 | NodeEventEmitter,
        public readonly type: string,
        public readonly logger: CatLogger) {
    }

    protected abstract handle(...args: any[]): Promise<void> | void;

    public install() {
        if (this.#handler !== undefined)
            throw new Error('Already installed!');

        this.#handler = (...args: any[]) => this.handle(...args);
        this.events.on(this.type, this.#handler);
    }

    public uninstall() {
        if (this.#handler === undefined)
            return;

        this.events.off(this.type, this.#handler);
        this.#handler = undefined;
    }
}


