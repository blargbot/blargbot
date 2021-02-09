import { EventEmitter, ListenerFn } from 'eventemitter3';

export type BaseEvents = Record<string, unknown[]>;
export type EventNames<TEvents> = string & keyof TEvents;
export type AnyEventListener<TEvents extends BaseEvents>
    = <T extends EventNames<TEvents>>(event: T, message: TEvents[T]) => void;
export type EventListener<TEvents extends BaseEvents, TEvent extends EventNames<TEvents>>
    = (...args: TEvents[TEvent]) => void;

export abstract class TypedEventEmitter<TEvents extends BaseEvents> {
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #events: EventEmitter;
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #anyEvent: Set<AnyEventListener<TEvents>>;

    public constructor() {
        this.#events = new EventEmitter();
        this.#anyEvent = new Set();
    }

    public eventNames(): Array<EventNames<TEvents>> {
        return <Array<EventNames<TEvents>>>this.#events.eventNames();
    }

    public listeners<T extends EventNames<TEvents>>(event: T): Array<EventListener<TEvents, T>>;
    public listeners<T extends EventNames<TEvents>>(event: T, exists: boolean): Array<EventListener<TEvents, T>> | boolean;
    public listeners<T extends EventNames<TEvents>>(event: T, exists?: boolean): Array<EventListener<TEvents, T>> | boolean {
        return this.#events.listeners(event, <boolean>exists);
    }

    protected emit<T extends EventNames<TEvents>>(event: T, ...args: TEvents[T]): boolean {
        if (this.#anyEvent.size === 0)
            return this.#events.emit(event, ...args);
        this.#events.emit(event, ...args);
        for (const ev of this.#anyEvent)
            ev(event, args);
        return true;
    }

    public on<T extends EventNames<TEvents>>(event: T, fn: EventListener<TEvents, T>): this {
        this.#events.on(event, <ListenerFn>fn);
        return this;
    }

    public onAll(fn: AnyEventListener<TEvents>): this {
        this.#anyEvent.add(fn);
        return this;
    }

    public addListener<T extends EventNames<TEvents>>(event: T, fn: EventListener<TEvents, T>): this {
        this.#events.addListener(event, <ListenerFn>fn);
        return this;
    }

    public once<T extends EventNames<TEvents>>(event: T, fn: EventListener<TEvents, T>): this {
        this.#events.once(event, <ListenerFn>fn);
        return this;
    }

    public removeListener<T extends EventNames<TEvents>>(event: T, fn?: EventListener<TEvents, T>, once?: boolean): this {
        this.#events.removeListener(event, <ListenerFn>fn, undefined, once);
        return this;
    }

    public off<T extends EventNames<TEvents>>(event: T, fn?: EventListener<TEvents, T>, once?: boolean): this {
        this.#events.off(event, <ListenerFn>fn, undefined, once);
        return this;
    }

    public offAll(fn: AnyEventListener<TEvents>): this {
        this.#anyEvent.delete(fn);
        return this;
    }

    public removeAllListeners<T extends EventNames<TEvents>>(event?: T): this {
        this.#events.removeAllListeners(event);
        return this;
    }

}