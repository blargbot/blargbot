import { EventEmitter } from 'events';

export class TypedEventEmitter<TContract extends Record<keyof TContract, readonly unknown[]>> extends EventEmitter {
    readonly #relayTargets = new Set<EventEmitter>();

    public addRelay<TOther extends TContract>(other: TypedEventEmitter<TOther>): this
    public addRelay(other: EventEmitter): this {
        this.#relayTargets.add(other);
        return this;
    }

    public removeRelay<TOther extends TContract>(other: TypedEventEmitter<TOther>): this
    public removeRelay(other: EventEmitter): this {
        this.#relayTargets.delete(other);
        return this;
    }

    public override emit<T extends keyof TContract>(event: T, ...args: TContract[T]): boolean;
    public override emit(event: PropertyKey, ...args: unknown[]): boolean;
    public override emit(event: PropertyKey, ...args: never): boolean {
        if (typeof event === 'number')
            event = event.toString();

        try {
            for (const target of this.#relayTargets)
                target.emit(event, ...args as unknown[]);
            return super.emit(event, ...args as unknown[]);
        } catch (err: unknown) {
            if (event === 'error')
                throw err;
            this.emit('error', err);
            return true;
        }
    }

    public override on<T extends keyof TContract>(event: T, handler: (...args: TContract[T]) => void | Promise<void>): this;
    public override on(event: PropertyKey, handler: (...args: unknown[]) => void | Promise<void>): this;
    public override on(event: PropertyKey, handler: (...args: never) => void | Promise<void>): this {
        if (typeof event === 'number')
            event = event.toString();
        return super.on(event, handler as (...args: readonly unknown[]) => void);
    }

    public override off<T extends keyof TContract>(event: T, handler: (...args: TContract[T]) => void | Promise<void>): this;
    public override off(event: PropertyKey, handler: (...args: unknown[]) => void | Promise<void>): this;
    public override off(event: PropertyKey, handler: (...args: never) => void | Promise<void>): this {
        if (typeof event === 'number')
            event = event.toString();
        return super.off(event, handler as (...args: readonly unknown[]) => void);
    }

    public override once<T extends keyof TContract>(event: T, handler: (...args: TContract[T]) => void | Promise<void>): this;
    public override once(event: PropertyKey, handler: (...args: unknown[]) => void | Promise<void>): this;
    public override once(event: PropertyKey, handler: (...args: never) => void | Promise<void>): this {
        if (typeof event === 'number')
            event = event.toString();
        return super.once(event, handler as (...args: readonly unknown[]) => void);
    }

    public override addListener<T extends keyof TContract>(event: T, handler: (...args: TContract[T]) => void | Promise<void>): this;
    public override addListener(event: PropertyKey, handler: (...args: unknown[]) => void | Promise<void>): this;
    public override addListener(event: PropertyKey, handler: (...args: never) => void | Promise<void>): this {
        if (typeof event === 'number')
            event = event.toString();
        return super.addListener(event, handler as (...args: readonly unknown[]) => void);
    }

    public override removeListener<T extends keyof TContract>(event: T, handler: (...args: TContract[T]) => void | Promise<void>): this;
    public override removeListener(event: PropertyKey, handler: (...args: unknown[]) => void | Promise<void>): this;
    public override removeListener(event: PropertyKey, handler: (...args: never) => void | Promise<void>): this {
        if (typeof event === 'number')
            event = event.toString();
        return super.removeListener(event, handler as (...args: readonly unknown[]) => void);
    }

    public override prependListener<T extends keyof TContract>(event: T, handler: (...args: TContract[T]) => void | Promise<void>): this;
    public override prependListener(event: PropertyKey, handler: (...args: unknown[]) => void | Promise<void>): this;
    public override prependListener(event: PropertyKey, handler: (...args: never) => void | Promise<void>): this {
        if (typeof event === 'number')
            event = event.toString();
        return super.prependListener(event, handler as (...args: readonly unknown[]) => void);
    }

    public override prependOnceListener<T extends keyof TContract>(event: T, handler: (...args: TContract[T]) => void | Promise<void>): this;
    public override prependOnceListener(event: PropertyKey, handler: (...args: unknown[]) => void | Promise<void>): this;
    public override prependOnceListener(event: PropertyKey, handler: (...args: never) => void | Promise<void>): this {
        if (typeof event === 'number')
            event = event.toString();
        return super.prependOnceListener(event, handler as (...args: readonly unknown[]) => void);
    }
}
