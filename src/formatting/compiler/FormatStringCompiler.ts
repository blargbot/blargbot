import { format } from '../types';
import { isFormattable } from '../util';
import { ReplacementContext } from './ReplacementContext';
import { ICompiledFormatString, IFormatStringCompiler, IFormatStringCompilerMiddleware, IValueResolver, IValueResolverTransform } from './types';

export interface FormatStringCompilerOptions {
    readonly middleware?: Iterable<IFormatStringCompilerMiddleware>;
    readonly transformers?: { readonly [P in string]?: IValueResolverTransform };
}

export class FormatStringCompiler implements IFormatStringCompiler {
    readonly #transformers: { readonly [P in string]?: IValueResolverTransform };
    readonly #compile: (template: string) => ICompiledFormatString;

    public constructor(options?: FormatStringCompilerOptions) {
        this.#transformers = { ...options?.transformers };
        this.#compile = [...options?.middleware ?? []]
            .reduceRight(
                (p, c) => c.handle.bind(c, this, p),
                this.#compileCore.bind(this)
            );
    }

    public compile(template: string): ICompiledFormatString {
        try {
            return this.#compile(template);
        } catch (err: unknown) {
            if (!(err instanceof Error))
                throw err;
            const offset = err.stack?.indexOf(err.message);
            const len = err.message.length;
            err.message += `\n - while processing template: ${JSON.stringify(template)}`;
            if (err.stack !== undefined && offset !== undefined && offset !== -1)
                err.stack = err.stack.slice(0, offset) + err.message + err.stack.slice(len + offset);
            throw err;
        }
    }

    #compileCore(template: string): ICompiledFormatString {
        const parts = parse(template);
        const context = 'context';
        const literals: string[] = [];
        const joinValues: string[] = [];
        const argNames: string[] = [];
        const handlers: Array<(context: ReplacementContext) => string> = [];
        let i = 0;
        for (const part of parts) {
            if (typeof part === 'string') {
                joinValues.push(JSON.stringify(part));
                literals.push(part);
            } else {
                const argName = `arg${++i}`;
                joinValues.push(`${argName}(${context})`);
                argNames.push(argName);
                handlers.push(this.#createReplacementHandler(part));
            }
        }

        let factorySrc: string;
        if (joinValues.length === 0)
            factorySrc = '() => () => ""';
        else if (joinValues.length === literals.length)
            factorySrc = `() => () => ${JSON.stringify(literals.join(''))}`;
        else
            factorySrc = `(${argNames.join(', ')}) => (${context}) => ${joinValues.join(' + ')}`;

        const factory = eval(factorySrc) as (...args: typeof handlers) => (context: ReplacementContext) => string;

        return Object.assign(factory(...handlers), { template });
    }

    #createReplacementHandler(details: ReplacementDetails): (context: ReplacementContext) => string {
        const source = details.transformers.reduce(
            (p, c) => this.#createTransformer(p, c),
            this.#createValueSource(...details.path)
        );
        const fallback = details.fallback ?? '';
        return ctx => {
            const value = source(ctx);
            switch (typeof value) {
                case 'string': return value.length === 0 ? fallback : value;
                case 'undefined': return fallback;
                case 'object':
                    if (value === null)
                        return fallback;
            }
            return String(value);
        };
    }

    #createValueSource(...path: string[]): IValueResolver {
        let getRoot = (v: readonly unknown[]): unknown => v[v.length - 1];
        if (path.length > 0 && path[0].startsWith('~')) {
            getRoot = v => v[0];
            path[0] = path[0].slice(1);
        }
        return ctx => {
            let value = getRoot(ctx.valueStack);
            for (const key of path) {
                if (typeof value !== 'object' || value === null)
                    return undefined;
                value = (value as Record<string, unknown>)[key];
            }
            if (typeof value === 'function')
                value = value();
            if (isFormattable(value))
                value = value[format](ctx.formatter);
            return value;
        };
    }

    #createTransformer(previous: IValueResolver, details: TransformerDetails): IValueResolver {
        const compiler = this.#transformers[details.name];
        if (compiler === undefined)
            throw new Error(`Unknown transformer ${details.name}`);

        return compiler.transform(this, previous, ...details.args);
    }
}

const enum TemplateTokenType {
    LITERAL,
    REPLACEMENT_START,
    REPLACEMENT_END,
    PATH_SEPARATOR,
    TRANSFORM_START,
    TRANSFORM_ARGS_START,
    TRANSFORM_ARGS_END,
    TRANSFORM_ARGS_SEPARATOR,
    DEFAULT_START,
    ESCAPED
}

interface TemplateToken {
    readonly type: TemplateTokenType;
    readonly start: number;
    readonly end: number;
    readonly content: string;
}

interface ReplacementDetails {
    readonly path: readonly string[];
    readonly transformers: readonly TransformerDetails[];
    readonly fallback?: string;
}

interface TransformerDetails {
    readonly name: string;
    readonly args: readonly string[];
}

function share<T>(source: IterableIterator<T>): IterableIterator<T> {
    return {
        [Symbol.iterator]() {
            return this;
        },
        next: source.next.bind(source),
        throw: source.throw?.bind(source)
    };
}

function* parse(template: string): Generator<string | ReplacementDetails> {
    const tokens = tokenize(template);
    const sharedTokens = share(tokens);
    for (const token of tokens) {
        if (token.type === TemplateTokenType.REPLACEMENT_START)
            yield parseReplacement(sharedTokens, token);
        else if (token.type === TemplateTokenType.ESCAPED && token.content !== '{' && token.content !== '}')
            yield `\\${token.content}`;
        else
            yield token.content;
    }
}

function parseReplacement(tokens: IterableIterator<TemplateToken>, prevToken: TemplateToken): ReplacementDetails {
    let path: string[];
    let transformers: TransformerDetails[];
    let fallback: string | undefined;
    [path, prevToken] = parsePath(tokens, prevToken);
    [transformers, prevToken] = parseTransformers(tokens, prevToken);
    [fallback, prevToken] = parseDefault(tokens, prevToken);
    if (prevToken.type !== TemplateTokenType.REPLACEMENT_END) {
        for (const token of tokens) {
            prevToken = token;
            break;
        }
        if (prevToken.type !== TemplateTokenType.REPLACEMENT_END)
            throw new Error('Expected replacement end but got something else');
    }
    return { path, transformers, fallback };
}

function parsePath(tokens: IterableIterator<TemplateToken>, prevToken: TemplateToken): [result: string[], lastToken: TemplateToken] {
    if (prevToken.type !== TemplateTokenType.REPLACEMENT_START)
        throw new Error('Unexpected replacement path');
    const result: string[] = [];
    const current: string[] = [];
    for (const token of tokens) {
        switch (token.type) {
            case TemplateTokenType.REPLACEMENT_END:
            case TemplateTokenType.TRANSFORM_START:
            case TemplateTokenType.DEFAULT_START:
                if (current.length > 0)
                    result.push(current.join(''));
                return [result, token];
            case TemplateTokenType.PATH_SEPARATOR:
                if (current.length > 0)
                    result.push(current.splice(0, Number.MAX_VALUE).join(''));
                break;
            default:
                current.push(token.content);
                break;
        }
    }
    throw new Error('Unexpected end of template');
}

function parseTransformers(tokens: IterableIterator<TemplateToken>, prevToken: TemplateToken): [result: TransformerDetails[], lastToken: TemplateToken] {
    const result = [];
    let transformer: TransformerDetails;
    while (prevToken.type === TemplateTokenType.TRANSFORM_START) {
        [transformer, prevToken] = parseTransformer(tokens, prevToken);
        result.push(transformer);
    }
    return [result, prevToken];
}
function parseTransformer(tokens: IterableIterator<TemplateToken>, prevToken: TemplateToken): [result: TransformerDetails, lastToken: TemplateToken] {
    let name: string;
    let args: string[];
    [name, prevToken] = parseTransformerName(tokens, prevToken);
    [args, prevToken] = parseTransformerArgs(tokens, prevToken);
    return [{ name, args }, prevToken];
}

function parseTransformerName(tokens: IterableIterator<TemplateToken>, prevToken: TemplateToken): [result: string, lastToken: TemplateToken] {
    if (prevToken.type !== TemplateTokenType.TRANSFORM_START)
        throw new Error('Unexpected transformer name');
    const result = [];
    for (const token of tokens) {
        switch (token.type) {
            case TemplateTokenType.REPLACEMENT_END:
            case TemplateTokenType.TRANSFORM_START:
            case TemplateTokenType.TRANSFORM_ARGS_START:
            case TemplateTokenType.TRANSFORM_ARGS_END:
            case TemplateTokenType.TRANSFORM_ARGS_SEPARATOR:
            case TemplateTokenType.DEFAULT_START:
                if (result.length === 0)
                    throw new Error('Transformer name cannot be empty');
                return [result.join(''), token];
            default:
                result.push(token.content);
        }
    }
    throw new Error('Unexpected end of template');
}

function parseTransformerArgs(tokens: IterableIterator<TemplateToken>, prevToken: TemplateToken): [result: string[], lastToken: TemplateToken] {
    switch (prevToken.type) {
        case TemplateTokenType.TRANSFORM_ARGS_SEPARATOR:
            throw new Error('Unexpected args separator');
        case TemplateTokenType.TRANSFORM_ARGS_END:
            throw new Error('Unexpected args end');
        case TemplateTokenType.REPLACEMENT_END:
        case TemplateTokenType.TRANSFORM_START:
        case TemplateTokenType.DEFAULT_START:
            return [[], prevToken];
    }

    const result = [];
    let arg: string;
    while (prevToken.type === TemplateTokenType.TRANSFORM_ARGS_START || prevToken.type === TemplateTokenType.TRANSFORM_ARGS_SEPARATOR) {
        [arg, prevToken] = parseTransformerArg(tokens, prevToken);
        result.push(arg);
    }
    for (const token of tokens)
        return [result, token];
    return [result, prevToken];
}

function parseTransformerArg(tokens: IterableIterator<TemplateToken>, prevToken: TemplateToken): [result: string, lastToken: TemplateToken] {
    if (prevToken.type !== TemplateTokenType.TRANSFORM_ARGS_START && prevToken.type !== TemplateTokenType.TRANSFORM_ARGS_SEPARATOR)
        throw new Error('Unexpected transformer arg');
    const result = [];
    let bracketCount = 1;
    for (const token of tokens) {
        switch (token.type) {
            case TemplateTokenType.TRANSFORM_ARGS_START:
                bracketCount++;
                break;
            case TemplateTokenType.TRANSFORM_ARGS_END:
                if (--bracketCount === 0)
                    return [result.join(''), token];
                break;
            case TemplateTokenType.TRANSFORM_ARGS_SEPARATOR:
                if (bracketCount <= 1)
                    return [result.join(''), token];
                break;
            case TemplateTokenType.ESCAPED:
                switch (token.content) {
                    case '(':
                    case ')':
                    case '|':
                        break;
                    default:
                        result.push('\\');
                }
                break;
        }
        result.push(token.content);
    }
    throw new Error('Unexpected end of template');
}

function parseDefault(tokens: IterableIterator<TemplateToken>, prevToken: TemplateToken): [result: string | undefined, lastToken: TemplateToken] {
    if (prevToken.type !== TemplateTokenType.DEFAULT_START)
        return [undefined, prevToken];

    const result = [];
    for (const token of tokens) {
        switch (token.type) {
            case TemplateTokenType.REPLACEMENT_END:
                return [result.join(''), token];
            default:
                result.push(token.content);
        }
    }
    throw new Error('Unexpected end of template');
}

function* tokenize(template: string): Generator<TemplateToken> {
    let prev = 0;
    function* literal(start: number): Generator<TemplateToken> {
        if (prev < start)
            yield { type: TemplateTokenType.LITERAL, start: prev, end: start, content: template.slice(prev, start) };
    }
    function* token(type: TemplateTokenType, start: number, end: number, content = template[start]): Generator<TemplateToken> {
        yield* literal(start);
        yield { type, start, end, content };
        prev = end;
    }

    for (let i = 0; i < template.length; i++) {
        switch (template[i]) {
            case '\\':
                if (i >= template.length - 1)
                    continue;
                yield* token(TemplateTokenType.ESCAPED, i++, i + 1, template[i]);
                break;
            default: {
                const type = tokenMap[template[i]];
                if (type === undefined)
                    continue;
                yield* token(type, i, i + 1);
            }
        }
    }

    yield* literal(template.length);
}

const tokenMap: { [P in string]?: TemplateTokenType } = {
    ['{']: TemplateTokenType.REPLACEMENT_START,
    ['}']: TemplateTokenType.REPLACEMENT_END,
    ['.']: TemplateTokenType.PATH_SEPARATOR,
    ['#']: TemplateTokenType.TRANSFORM_START,
    ['(']: TemplateTokenType.TRANSFORM_ARGS_START,
    ['|']: TemplateTokenType.TRANSFORM_ARGS_SEPARATOR,
    [')']: TemplateTokenType.TRANSFORM_ARGS_END,
    ['=']: TemplateTokenType.DEFAULT_START
};
