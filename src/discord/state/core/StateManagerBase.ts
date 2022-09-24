import { StateManagerCollectionIndex } from './StateManagerCollectionIndex';
import { StateManager } from './types';

export abstract class StateManagerBase<TSelf extends StateManagerBase<TSelf, TInit, TState, TUpdate>, TInit, TState, TUpdate> implements StateManager<TInit, TState, TUpdate> {
    readonly #definitions: { [P in keyof TSelf]?: ((init: TInit) => TSelf[P]) | undefined; };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    readonly #indexes: Array<StateManagerCollectionIndex<any>>;
    #state?: TState;

    public get state(): TState { return this.notInitialized(); }

    protected constructor(definitions: { [P in keyof TSelf]?: (init: TInit) => TSelf[P] }) {
        this.#definitions = definitions;
        this.#indexes = [];
    }

    protected notInitialized(): never {
        throw new Error('Must call init first');
    }

    public init(init: TInit): void {
        Object.defineProperty(this, 'state', {
            get: () => this.#state ??= this.getInitialState(init),
            set: (state: TState) => this.#state = state,
            enumerable: true
        });

        for (const definition of Object.entries(this.#definitions) as Array<[string, ((init: TInit) => unknown)]>) {
            const value = definition[1](init);
            if (value instanceof StateManagerCollectionIndex)
                this.#indexes.push(value);

            Object.defineProperty(this, definition[0], { value, writable: false });
        }
    }

    public update(update: TUpdate): void {
        this.#state = this.updateState(this.state, update);
    }

    public delete(): void {
        for (const index of this.#indexes) {
            index.clear();
            index.dispose();
        }
    }

    protected abstract getInitialState(init: TInit): TState;
    protected abstract updateState(current: TState, update: TUpdate): TState;
}
