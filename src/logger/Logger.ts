import { Type } from '@blargbot/di';
import { LogMeta } from 'cat-loggr/ts';

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

const logMetaType = Type.interface<LogMeta>(() => ({
    color: Type.boolean.optional,
    context: Type.object.optional,
    depth: Type.number.optional,
    quote: Type.boolean.optional,
    shardId: Type.union(Type.number, Type.string).optional,
    trace: Type.boolean.optional
}));

const logMethodType = Type.method(Type.void, ...Type.spread(Type.unknown.array));

export const loggerType: Type<Logger> = Type.interface(logger => ({
    addArgHook: Type.method(logger, Type.method(Type.string.nullable, Type.interface<ArgData>(() => ({
        arg: Type.unknown,
        date: Type.instanceOf(Date)
    })))),
    addPostHook: Type.method(logger, Type.method(Type.void, Type.interface<PostLogData>(() => ({
        context: Type.object.optional,
        date: Type.instanceOf(Date),
        error: Type.boolean,
        level: Type.string,
        meta: logMetaType,
        shard: Type.string.optional,
        text: Type.string,
        timestamp: Type.string
    })))),
    addPreHook: Type.method(logger, Type.method(Type.string.nullable, Type.interface<PreLogData>(() => ({
        args: Type.unknown.array,
        context: Type.object.optional,
        date: Type.instanceOf(Date),
        error: Type.boolean,
        level: Type.string,
        meta: logMetaType,
        shard: Type.string.optional,
        timestamp: Type.string
    })))),
    setGlobal: Type.method(logger),
    setLevel: Type.method(logger, Type.string),
    adebug: logMethodType,
    bbtag: logMethodType,
    cluster: logMethodType,
    command: logMethodType,
    database: logMethodType,
    debug: logMethodType,
    dir: logMethodType,
    error: logMethodType,
    fatal: logMethodType,
    info: logMethodType,
    init: logMethodType,
    log: logMethodType,
    middleware: logMethodType,
    module: logMethodType,
    output: logMethodType,
    shardi: logMethodType,
    trace: logMethodType,
    verbose: logMethodType,
    warn: logMethodType,
    website: logMethodType,
    worker: logMethodType,
    ws: logMethodType
}));

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
