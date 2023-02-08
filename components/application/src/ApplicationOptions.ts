export interface ApplicationOptions {
    readonly startTime?: AbortSignal | number;
    readonly stopTime?: AbortSignal | number;
    readonly shutdownOn?: ReadonlyArray<NodeJS.Signals | 'uncaughtException' | 'unhandledRejection'>;
}
