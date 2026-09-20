export interface ArgsLocals extends Record<string, unknown> {
    args: {
        readonly positional: readonly string[];
        readonly raw: string;
    };
}

export interface CustomCommandLocals extends Record<string, unknown> {
    isCC: boolean;
}

export interface AuthorizerLocals extends Record<string, unknown> {
    authorizerId: string;
}

export interface AuthorLocals extends Record<string, unknown> {
    authorId: string;
}

export interface FallbackLocals extends Record<string, unknown> {
    fallback?: string;
}

export interface VariablesLocals extends Record<string, unknown> {
    variables: {
        get(name: string): Awaitable<JToken | undefined>;
        set(name: string, value: JToken | undefined): Awaitable<void>;
        reset(names?: readonly string[]): Awaitable<void>;
        persist(names?: readonly string[]): Awaitable<void>;
    };
}

export interface ReplaceOutputLocals extends Record<string, unknown> {
    replaceOutput: Array<(output: string) => Awaitable<string>>;
}

export interface RegExpCompilerLocals extends Record<string, unknown> {
    compileRegExp(pattern: string, flags: string): Awaitable<SafeRegExp>;
}

export interface SafeRegExp {
    test(text: string): Awaitable<boolean>;
    split(text: string): Awaitable<AwaitableIterable<string>>;
    replace(text: string, replacement: string): Awaitable<string>;
    match(text: string): Awaitable<AwaitableIterable<string>>;
}

export interface BrainfuckLocals extends Record<string, unknown> {
    brainfuck(code: string, input: string): Awaitable<string>;
}
