
export interface Logger {
    error(...args: unknown[]): void;
    info(...args: unknown[]): void;
}
