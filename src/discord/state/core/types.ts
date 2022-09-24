export interface StateManager<TInit, TState, TUpdate> {
    get state(): TState;
    set state(state: TState);

    init(init: TInit): void;
    update(update: TUpdate): void;
    delete(): void;
}

export interface StateManagerCollectionOptions<TManager, TInit, TState, TUpdate> {
    readonly type: abstract new (...args: never) => TManager;
    readonly indexes: Array<keyof TManager>;
    createNew(): TManager;
    getId(state: TInit | TState | TUpdate): string;
}
