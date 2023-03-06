export interface BBTagLogger {
    info(...args: unknown[]): void;
    error(...args: unknown[]): void;
}
