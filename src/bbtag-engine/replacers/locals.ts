import type { BBTagContext } from '../BBTagContext.js';
import type { BBTagExpression } from '../language/BBTagExpression.js';

export interface ArgsLocals {
    args: string[];
}
export interface PrefixLocals {
    prefix: string;
}

type Letters = 'abcdefghijklmnopqrstuvwxyz';
type Digits = '0123456789';
type AlphaNumerics = `${Letters}${Uppercase<Letters>}${Digits}`
type Characters<T extends string, Result = never> = T extends `${infer Char1}${infer Rest}` ? Characters<Rest, Char1 | Result> : Result;
export type FlagCharacters = Characters<AlphaNumerics>;
export interface FlagsLocals {
    flags: { [P in FlagCharacters]?: readonly string[] } & { _: readonly string[]; };
}

export interface CustomCommandLocals {
    isCC: boolean;
}

export interface CommandLocals {
    commmandName: string;
}

export interface AuthorizerLocals {
    authorizerId: string;
}

export interface AuthorLocals {
    authorId: string;
}

export interface FallbackLocals {
    fallback?: string;
}

export interface VariablesLocals {
    variables: VariableStore;
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
    replaceOutput: Array<(output: string) => Awaitable<string>>;
}

export interface RegExpCompilerLocals {
    compileRegExp: (pattern: string, flags: string) => Awaitable<SafeRegExp>;
}

export interface SafeRegExp {
    test(text: string): Awaitable<boolean>;
    split(text: string): Awaitable<AwaitableIterable<string>>;
    replace(text: string, replacement: string): Awaitable<string>;
    match(text: string): Awaitable<AwaitableIterable<string>>;
}

export interface BrainfuckLocals {
    brainfuck: (code: string, input: string) => Awaitable<string>;
}

export interface TemporalLocals {
    parseTime: (input: string, format: string, timezone: string) => undefined | TemporalValue;
}

export interface TemporalValue {
    toString(format: string, timezone: string): string;
}
export interface DecancerLocals {
    decancer: (value: string) => string;
}

export interface FunctionLocals {
    functions: Record<`func.${string}`, BBTagExpression | undefined>;
    functionParameters?: readonly string[];
}

export interface ExecTagLocals {
    getTag: (tagName: string) => Awaitable<ExecutableTag | undefined>;
}
export interface ExecCustomCommandLocals {
    getCustomCommand: (tagName: string) => Awaitable<ExecutableTag | undefined>;
}

export interface ExecutableTag {
    execute(context: BBTagContext<object>, args: string | string[]): Awaitable<string>;
}

export interface NsfwLocals {
    nsfw: { value?: string; };
}

export interface QuietLocals {
    quiet?: boolean;
}

export interface ReasonLocals {
    reason?: string;
}

export interface SuppressLookupLocals {
    suppressLookup?: boolean;
}
