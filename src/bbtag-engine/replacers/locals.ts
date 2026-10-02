import type { BBTagContext } from '../BBTagContext.js';
import type { BBTagExpression } from '../language/BBTagExpression.js';
import type { BBTagSubtag } from '../language/BBTagSubtag.js';

export interface ArgsLocals {
    readonly args: string[];
}
export interface PrefixLocals {
    readonly prefix: string;
}

type Letters = 'abcdefghijklmnopqrstuvwxyz';
type Digits = '0123456789';
type AlphaNumerics = `${Letters}${Uppercase<Letters>}${Digits}`
type Characters<T extends string, Result = never> = T extends `${infer Char1}${infer Rest}` ? Characters<Rest, Char1 | Result> : Result;
export type FlagCharacters = Characters<AlphaNumerics>;
export interface FlagsLocals {
    readonly flags: { readonly [P in FlagCharacters]?: readonly string[] } & { readonly _: readonly string[]; };
}

export interface CustomCommandLocals {
    readonly isCC: boolean;
}

export interface CommandLocals {
    readonly commmandName: string;
}

export interface AuthorizerLocals {
    readonly authorizerId: string;
}

export interface AuthorLocals {
    readonly authorId: string;
}

export interface FallbackLocals {
    fallback: string | null;
}

export interface DebugLocals {
    readonly debug: DebugEntry[];
}

export interface DebugEntry {
    readonly bbtag: BBTagSubtag;
    readonly text: string;
}

export interface RequestLocals {
    readonly httpRequest: (request: HttpRequest) => Awaitable<HttpResponse>;
}

export type HttpMethod = 'GET' | 'QUERY' | 'HEAD' | 'POST' | 'PUT' | 'DELETE' | 'OPTIONS' | 'PATCH';

export interface HttpRequest {
    method: HttpMethod;
    url: string;
    headers: Headers;
    body: Uint8Array;
}

export interface HttpResponse {
    url: string;
    status: number;
    statusText: string;
    headers: Headers;
    body: Uint8Array;
    isTruncated: boolean;
}

export interface DumpLocals {
    readonly dump: (content: string) => Awaitable<URL>;
}

export interface VariablesLocals {
    readonly variables: VariableStore;
}

export interface VariableStore {
    get(name: string): Awaitable<VariableReference>;
    set(name: string, value: JToken | undefined): Awaitable<void>;
    rollback(names?: readonly string[]): Awaitable<void>;
    commit(names?: readonly string[]): Awaitable<void>;
}

export interface VariableReference {
    readonly key: string;
    readonly value: JToken | undefined;
}

export interface ReplaceOutputLocals {
    readonly outputReplacers: Array<(output: string) => Awaitable<string>>;
}

export interface RegExpCompilerLocals {
    readonly compileRegExp: (pattern: string, flags: string) => Awaitable<SafeRegExp>;
}

export interface SleepLocals {
    readonly sleep: (durationMs: number) => Promise<void>;
}

export interface TimerLocals {
    readonly schedule: (context: BBTagContext<object>, code: BBTagExpression, timeoutMs: number) => Awaitable<void>;
}

export interface LockLocals {
    inLock: boolean;
    readonly lock: (mode: 'read' | 'write', key: string) => Awaitable<AsyncDisposable | Disposable>;
}

export interface SafeRegExp {
    test(text: string): Awaitable<boolean>;
    split(text: string): Awaitable<AwaitableIterable<string>>;
    replace(text: string, replacement: string): Awaitable<string>;
    match(text: string): Awaitable<AwaitableIterable<string>>;
}

export interface BrainfuckLocals {
    readonly brainfuck: (code: string, input: string) => Awaitable<string>;
}

export interface TemporalOptions {
    readonly parseTime: (input: string, format: string, timezone: string) => undefined | TemporalValue;
}

export interface TemporalValue {
    toTimezone(timezone: string): TemporalValue;
    format(format: string): string;
}

export interface DecancerLocals {
    readonly decancer: (value: string) => string;
}

export interface FunctionLocals {
    readonly functions: Record<`func.${string}`, BBTagExpression | undefined>;
    functionParameters: readonly string[] | null;
}

export interface ExecTagLocals {
    readonly getTag: (tagName: string) => Awaitable<ExecutableTag | null>;
}
export interface ExecCustomCommandLocals {
    readonly getCustomCommand: (tagName: string) => Awaitable<ExecutableTag | null>;
}

export interface ExecutableTag {
    execute(context: BBTagContext<object>, args: string | string[]): Awaitable<string>;
}

export interface NsfwLocals {
    readonly nsfw: { value: string | null; };
}

export interface QuietLocals {
    quiet: boolean;
}

export interface ReasonLocals {
    reason: string | null;
}

export interface SuppressLookupLocals {
    suppressLookup: boolean;
}
