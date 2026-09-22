export interface ArgsLocals {
    args: {
        positional: readonly string[];
        raw: string;
    };
}

export interface CustomCommandLocals {
    isCC: boolean;
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
