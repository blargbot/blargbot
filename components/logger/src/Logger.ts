import { LogMeta } from 'cat-loggr/ts.js';

export type LogLevel =
    | 'fatal'
    | 'error'
    | 'warn'
    | 'website'
    | 'ws'
    | 'cluster'
    | 'worker'
    | 'command'
    | 'shardi'
    | 'init'
    | 'info'
    | 'trace'
    | 'output'
    | 'bbtag'
    | 'verbose'
    | 'adebug'
    | 'debug'
    | 'log'
    | 'dir'
    | 'database'
    | 'module'
    | 'middleware';

export type LogMethods = { [P in LogLevel]: (...args: unknown[]) => void }

export interface Logger extends LogMethods {
    setGlobal(): this;
    addPostHook(hook: LogHook<PostLogData>): this;
    addPreHook(hook: LogHook<PreLogData, string | null>): this;
    addArgHook(hook: LogHook<ArgData, string | null>): this;
    setLevel(level: string): this;
}

export type LogHook<Data, Result = void> = (data: Data) => Result;

export interface PostLogData {
    readonly level: string;
    readonly error: boolean;
    readonly text: string;
    readonly date: Date;
    readonly timestamp: string;
    readonly shard?: string;
    readonly context?: object;
    readonly meta: LogMeta;
}

export interface PreLogData {
    level: string;
    error: boolean;
    args: unknown[];
    date: Date;
    timestamp: string;
    shard?: string;
    context?: object;
    meta: LogMeta;
}

export interface ArgData {
    arg?: unknown;
    date: Date;
}
