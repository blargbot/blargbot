import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as inspector from 'node:inspector';
import path from 'node:path';
import { describe, it } from 'node:test';

import type { BBTagContext, BBTagReplacer, BBTagSerializer, BBTagSubtag, CompiledBBTagReplacer, FallbackLocals, LocatedBBTagRuntimeError, SourceMarker, SubtagArgumentArray } from '@blargbot/bbtag-engine';
import { BBTagEngine, BBTagRuntimeError, composeReplacer, defineReplacer, NotEnoughArgumentsError, parseBBTag, TooManyArgumentsError } from '@blargbot/bbtag-engine';
import type { Mockable, MockOptions } from '@blargbot/test-util';
import { Mock, MockError } from '@blargbot/test-util';

type SourceMarkerResolvable = SourceMarker | number | `${number}:${number}:${number}` | `${number}:${number}` | `${number}`;

export interface SubtagTestCase<Locals extends object = object> {
    readonly title?: string;
    readonly code: string;
    readonly subtagName?: string;
    readonly expected?: string | RegExp | (() => string | RegExp);
    readonly setup?: (context: SubtagTestContext<Locals>) => Awaitable<void>;
    readonly postSetup?: (context: BBTagContext<Locals>, mocks: SubtagTestContext<Locals>) => Awaitable<void>;
    readonly assert?: (context: BBTagContext<Locals>, result: string, test: SubtagTestContext<Locals>) => Awaitable<void>;
    readonly teardown?: (context: SubtagTestContext<Locals>) => Awaitable<void>;
    readonly expectError?: {
        required?: boolean;
        handle: (error: unknown) => Awaitable<void>;
    };
    readonly errors?: ReadonlyArray<{ start?: SourceMarkerResolvable; end?: SourceMarkerResolvable; error: BBTagRuntimeError; }> | ((errors: LocatedBBTagRuntimeError[]) => void);
    readonly skip?: boolean | (() => Awaitable<boolean>);
    readonly replacers?: Iterable<BBTagReplacer<Locals>>;
    readonly retries?: number;
    readonly timeout?: number;
}

interface TestSuiteConfig<Locals extends object> {
    readonly setup: Array<(context: SubtagTestContext<Locals>) => Awaitable<void>>;
    readonly assert: Array<(context: BBTagContext<Locals>, result: string, test: SubtagTestContext<Locals>) => Awaitable<void>>;
    readonly teardown: Array<(context: SubtagTestContext<Locals>) => Awaitable<void>>;
    readonly postSetup: Array<(context: BBTagContext<Locals>, mocks: SubtagTestContext<Locals>) => Awaitable<void>>;
}

export class MarkerError extends BBTagRuntimeError {
    public constructor(type: string, index: number) {
        super(`{${type}} called at ${index}`);
        this.display = '';
    }
}

export interface SubtagTestSuiteData<
    Locals extends object
> extends Pick<SubtagTestCase<Locals>, 'setup' | 'postSetup' | 'assert' | 'teardown'> {
    readonly cases: Array<SubtagTestCase<Locals>>;
    readonly replacer: CompiledBBTagReplacer<Locals & FallbackLocals>;
    readonly argCountBounds: { min: ArgCountBound; max: ArgCountBound; };
}

type ArgCountBound = number | { count: number; noEval: number[]; };

export class SubtagTestContext<Locals extends object> {
    readonly #allMocks: Mock[] = [];
    #isCreated = false;
    public readonly locals: Mock<Locals & FallbackLocals>;
    public readonly serializer: Mock<BBTagSerializer<Locals & FallbackLocals>>;

    public constructor(
        public readonly testCase: SubtagTestCase<Locals>,
        public readonly replacer: BBTagReplacer<Locals & FallbackLocals>
    ) {
        this.locals = this.createMock({ typeof: 'object' });
        this.serializer = this.createMock();

        this.locals.setup(x => x.fallback).returns(undefined);
        this.locals.setup(x => (x as { then?: undefined; }).then).returns(undefined);
        assert(this.locals.instance.fallback === undefined);
    }

    public createMock<T extends Mockable>(options?: MockOptions<T>): Mock<T> {
        const mock = new Mock<T>(options);
        this.#allMocks.push(mock);
        return mock;
    }

    public verifyAll(): void {
        const errors = [];
        for (const mock of this.#allMocks) {
            try {
                mock.verifyAll();
            } catch (err: unknown) {
                errors.push(err);
            }
        }
        switch (errors.length) {
            case 0: break;
            case 1: throw errors[0];
            default: throw new AggregateError(errors, errors.join('\n'));
        }
    }

    public async createContext(): Promise<BBTagContext<Locals & FallbackLocals>> {
        if (this.#isCreated)
            throw new Error('Cannot create multiple contexts from 1 mock');
        this.#isCreated = true;
        const engine = new BBTagEngine<Locals & FallbackLocals, Locals & FallbackLocals>({
            locals: {
                toInput(locals) {
                    return locals;
                },
                toLocals(input) {
                    return input;
                }
            },
            replacer: this.replacer,
            renderError: function* (err, ctx) {
                if (err.cause instanceof MockError)
                    throw err.cause;
                yield err.display ?? ctx.locals.fallback ?? `\`${err.message}\``;
            },
            serializer: this.serializer.instance
        });

        return await engine.createContext(this.locals.instance);
    }

    public createFetchResponse(): Mock<Response> {
        const mock = this.createMock<Response>();
        mock.setup(m => Reflect.getPrototypeOf(m)).returns(Response.prototype);
        return mock;
    }
}

export async function runSubtagTests<Locals extends object>(data: SubtagTestSuiteData<Locals>): Promise<void> {
    const suite = new SubtagTestSuite(data.replacer);
    if (data.setup !== undefined)
        suite.setup(data.setup);
    if (data.postSetup !== undefined)
        suite.postSetup(data.postSetup);
    if (data.assert !== undefined)
        suite.assert(data.assert);
    if (data.teardown !== undefined)
        suite.teardown(data.teardown);

    const min = typeof data.argCountBounds.min === 'number' ? { count: data.argCountBounds.min, noEval: [] } : data.argCountBounds.min;
    const max = typeof data.argCountBounds.max === 'number' ? { count: data.argCountBounds.max, noEval: [] } : data.argCountBounds.max;

    if (data.replacer.name !== null)
        suite.addTestCases(notEnoughArgumentsTestCases(data.replacer.name, min.count, min.noEval));
    suite.addTestCases(data.cases);
    if (data.replacer.name !== null && max.count < Infinity)
        suite.addTestCases(tooManyArgumentsTestCases(data.replacer.name, max.count, max.noEval));

    await suite.run();

    // Output a bbtag file that can be run on the live blargbot instance to find any errors
    if (inspector.url() !== undefined) {
        const blargTestSuite = `Errors:{clean;${data.cases.map(c => ({
            code: c.code,
            expected: getExpectation(c)
        })).map(c => `{if;==;|${c.code}|;|${c.expected?.toString() ?? ''}|;;
> {escapebbtag;${c.code}} failed -
Expected:
|${c.expected?.toString() ?? ''}|
Actual:
|${c.code}|}`).join('\n')}}
---------------
Finished!`;
        fs.writeFileSync(path.join(import.meta.dirname, '../../../test.bbtag'), blargTestSuite);
    }
}

export function sourceMarker(location: SourceMarkerResolvable): SourceMarker
export function sourceMarker(location: SourceMarkerResolvable | undefined): SourceMarker | undefined
export function sourceMarker(location: SourceMarkerResolvable | undefined): SourceMarker | undefined {
    if (typeof location === 'number')
        return { index: location, line: 0, column: location };
    if (typeof location === 'object')
        return location;
    if (typeof location === 'undefined')
        return undefined;

    const segments = location.split(':');
    const index = segments[0];
    const line = segments[1] ?? '0';
    const column = segments[2] ?? index;

    return { index: parseInt(index), line: parseInt(line), column: parseInt(column) };
}

export function createTestDataReplacer(values: Record<string, string | undefined>): BBTagReplacer {
    return {
        name: 'testData',
        aliases: new Set(),
        canReplace: () => true,
        replace: async function* testData(_, __, bbtag) {
            if (bbtag.args.length !== 1)
                throw new RangeError(`Subtag ${testData.name} must be given 1 argument!`);
            const key = bbtag.args[0].source;
            const value = values[key];
            if (value === undefined)
                throw new RangeError(`Subtag ${testData.name} doesnt have test data set up for ${JSON.stringify(value)}`);

            await Promise.resolve();
            yield value;
        }
    };
}
export function createLimitedReplacer(limit = 1): BBTagReplacer {
    const counts = new WeakMap<BBTagContext<object>, number>();
    return {
        name: 'limit',
        aliases: new Set(),
        canReplace: () => true,
        replace: async function* limited(context) {
            const count = counts.get(context) ?? 0;
            counts.set(context, count + 1);

            if (count >= limit)
                throw new Error(`Subtag {limit} cannot be called more than ${limit} time(s)`);
            yield await Promise.reject(new MarkerError('limit', count + 1));
        }
    };
}
export function createTestReplacer<Locals extends object>(name: string, execute: (context: BBTagContext<Locals>, args: SubtagArgumentArray, bbtag: BBTagSubtag) => Awaitable<JToken | undefined>): BBTagReplacer<Locals> {
    if (execute.name === 'execute' || execute.name === '')
        Object.defineProperty(execute, 'name', { value: name });
    return defineReplacer(name, {
        parameters: ['~args*'],
        returns: 'json|nothing',
        execute: execute
    });
}
export const evalReplacer: BBTagReplacer = {
    name: 'eval',
    aliases: new Set(),
    canReplace: () => true,
    replace: async function* $eval(_, __, bbtag) {
        yield await Promise.reject(new MarkerError('eval', bbtag.start.index));
    }
};
export const failReplacer: BBTagReplacer = {
    name: 'fail',
    aliases: new Set(),
    canReplace: () => true,
    replace: async function* $fail(_, __, bbtag) {
        yield await Promise.reject(new RangeError(`Subtag ${bbtag.source} was evaluated when it wasnt supposed to!`));
    }
};
export const echoReplacer: BBTagReplacer = {
    name: 'echoargs',
    aliases: new Set(),
    canReplace: () => true,
    replace: function* $echo(_, __, bbtag) {
        yield '[';
        yield JSON.stringify(bbtag.name.source);
        for (const arg of bbtag.args) {
            yield ',';
            yield JSON.stringify(arg.source);
        }
        yield ']';
    }
};

export class SubtagTestSuite<Locals extends object> {
    readonly #config: TestSuiteConfig<Locals> = { setup: [], assert: [], teardown: [], postSetup: [] };
    readonly #testCases: Array<SubtagTestCase<Locals>> = [];
    readonly #replacer: CompiledBBTagReplacer<Locals>;

    public constructor(replacer: CompiledBBTagReplacer<Locals>) {
        this.#replacer = replacer;
    }

    public setup(setup: TestSuiteConfig<Locals>['setup'][number]): this {
        this.#config.setup.push(setup);
        return this;
    }

    public postSetup(setup: TestSuiteConfig<Locals>['postSetup'][number]): this {
        this.#config.postSetup.push(setup);
        return this;
    }

    public assert(assert: TestSuiteConfig<Locals>['assert'][number]): this {
        this.#config.assert.push(assert);
        return this;

    }

    public teardown(teardown: TestSuiteConfig<Locals>['teardown'][number]): this {
        this.#config.teardown.push(teardown);
        return this;
    }

    public addTestCase(...testCases: Array<SubtagTestCase<Locals>>): this {
        return this.addTestCases(testCases);
    }

    public addTestCases(testCases: Iterable<SubtagTestCase<Locals>>): this {
        for (const testCase of testCases)
            this.#testCases.push(testCase);
        return this;
    }

    public async run(): Promise<void> {
        await describe(`{${this.#replacer.name ?? ''}}`, async () => {
            const subtag = this.#replacer;
            const config = this.#config;
            for (const testCase of this.#testCases) {
                const retries = Math.max(testCase.retries ?? 0, 0);
                const timeout = testCase.timeout === undefined ? undefined : (retries + 1) * testCase.timeout;
                await it(getTestName(testCase), { skip: await shouldSkip(testCase), timeout }, async () => {
                    for (let attempt = 0; attempt < retries; attempt++) {
                        try {
                            await runTestCase(subtag, testCase, config);
                            return;
                        } catch {
                            /* NO-OP */
                        }
                    }
                    await runTestCase(subtag, testCase, config);
                });
            }
        });
    }
}

function getTestName<Locals extends object>(testCase: SubtagTestCase<Locals>): string {
    let result = `should handle ${JSON.stringify(testCase.code)}`;
    const expected = getExpectation(testCase);
    switch (typeof expected) {
        case 'undefined': break;
        case 'string':
            result += ` and return ${JSON.stringify(expected)}`;
            break;
        case 'object':
            result += ` and return something matching ${expected.toString()}`;
            break;
    }

    if (typeof testCase.errors === 'object') {
        const [errorCount, markerCount] = testCase.errors.reduce((p, c) => c.error instanceof MarkerError ? [p[0], p[1] + 1] : [p[0] + 1, p[1]], [0, 0]);
        if (errorCount > 0 || markerCount > 0) {
            const errorStr = errorCount === 0 ? undefined : `${errorCount} error${errorCount === 1 ? '' : 's'}`;
            const markerStr = markerCount === 0 ? undefined : `${markerCount} marker${markerCount === 1 ? '' : 's'}`;
            result += ` with ${[markerStr, errorStr].filter(x => x !== undefined).join(' and ')}`;
        }
    }

    if (testCase.title !== undefined)
        result += ` - ${testCase.title}`;

    return result;
}

async function shouldSkip<Locals extends object>(testCase: SubtagTestCase<Locals>): Promise<boolean> {
    return typeof testCase.skip === 'boolean' ? testCase.skip : await testCase.skip?.() ?? false;
}

async function runTestCase<Locals extends object>(
    replacer: CompiledBBTagReplacer<Locals>,
    testCase: SubtagTestCase<Locals>,
    config: TestSuiteConfig<Locals>
): Promise<void> {
    const subtags = composeReplacer(b => b
        .register(replacer)
        .register(evalReplacer)
        .register(failReplacer)
        .registerAll(testCase.replacers ?? [])
    );
    const test = new SubtagTestContext(testCase, subtags);
    const code = parseBBTag(testCase.code);
    if (code instanceof BBTagRuntimeError)
        throw code;

    try {
        // arrange
        for (const setup of config.setup)
            await setup(test);
        await testCase.setup?.(test);
        const context = await test.createContext();
        for (const postSetup of config.postSetup)
            await postSetup(context, test);
        await testCase.postSetup?.(context, test);

        const expected = getExpectation(testCase);

        // act
        const result = await runSafe(() => context.eval(code));
        if (!result.success) {
            if (testCase.expectError === undefined)
                throw result.error;
            await testCase.expectError.handle(result.error);
            return;
        } else if (testCase.expectError?.required === true) {
            throw new Error('Expected an error to be thrown!');
        }

        // assert
        switch (typeof expected) {
            case 'string':
                assert.equal(result.value, expected);
                break;
            case 'object':
                assert.match(result.value, expected);
                break;
        }

        await testCase.assert?.(context, result.value, test);
        for (const assert of config.assert)
            await assert.call(testCase, context, result.value, test);

        if (typeof testCase.errors === 'function') {
            testCase.errors(context.errors);
        } else {
            const errors = context.errors.map(err => ({
                error: err.error,
                start: err.bbtag.start,
                end: err.bbtag.end
            }));
            const expected = testCase.errors?.map(err => ({
                error: err.error,
                start: sourceMarker(err.start),
                end: sourceMarker(err.end)
            })) ?? [];
            assert.deepEqual(errors, expected);
        }
        test.verifyAll();
    } finally {
        for (const teardown of config.teardown)
            await teardown(test);
    }
}

async function runSafe<T>(action: () => Awaitable<T>): Promise<{ success: true; value: T; } | { success: false; error: unknown; }> {
    try {
        return { success: true, value: await action() };
    } catch (err: unknown) {
        return { success: false, error: err };
    }
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
function getExpectation<Locals extends object>(testCase: SubtagTestCase<Locals>): Exclude<SubtagTestCase<Locals>['expected'], Function> {
    if (typeof testCase.expected === 'function')
        return testCase.expected();
    return testCase.expected;
}

export function* notEnoughArgumentsTestCases<Locals extends object>(
    subtagName: string,
    minArgCount: number,
    noEval: number[]
): Generator<SubtagTestCase<Locals>> {
    const noEvalLookup = new Set(noEval);
    for (let i = 0; i < minArgCount; i++) {
        const codeParts = Array.from({ length: i }, (_, j) => {
            const start = 2 + subtagName.length + 7 * j;
            return [noEvalLookup.has(j), { start, end: start + 6, error: new MarkerError('eval', start) }] as const;
        });
        yield {
            code: `{${[subtagName, ...codeParts.map(p => p[0] ? '{fail}' : '{eval}')].join(';')}}`,
            expected: '`Not enough arguments`',
            errors: [
                ...codeParts.filter(p => !p[0]).map(p => p[1]),
                { start: 0, end: 2 + subtagName.length + 7 * i, error: new NotEnoughArgumentsError(minArgCount, i) }
            ]
        };
    }
    const codeParts = Array.from({ length: minArgCount }, (_, j) => {
        const start = 2 + subtagName.length + 7 * j;
        return [noEvalLookup.has(j), { start, end: start + 6, error: new MarkerError('eval', start) }] as const;
    });
    yield {
        title: 'Min arg count',
        code: `{${[subtagName, ...codeParts.map(p => p[0] ? '{fail}' : '{eval}')].join(';')}}`,
        expected: /^(?!`Not enough arguments`|`Too many arguments`).*$/gis,
        errors(err) {
            const errorTypes = new Set(err.map(x => x.error.constructor));
            assert(!errorTypes.has(NotEnoughArgumentsError));
            assert(!errorTypes.has(TooManyArgumentsError));
        },
        expectError: {
            handle() { /* NOOP */ }
        }
    };
}

export function* tooManyArgumentsTestCases<Locals extends object>(
    subtagName: string,
    maxArgCount: number,
    noEval: number[]
): Generator<SubtagTestCase<Locals>> {
    const noEvalLookup = new Set(noEval);
    const codeParts = Array.from({ length: maxArgCount + 1 }, (_, j) => {
        const start = 2 + subtagName.length + 7 * j;
        return [noEvalLookup.has(j), { start, end: start + 6, error: new MarkerError('eval', start) }] as const;
    });
    yield {
        title: 'Max arg count',
        code: `{${[subtagName, ...codeParts.slice(0, maxArgCount).map(p => p[0] ? '{fail}' : '{eval}')].join(';')}}`,
        expected: /^(?!`Not enough arguments`|`Too many arguments`).*$/gis,
        errors(err) {
            const errorTypes = new Set(err.map(x => x.error.constructor));
            assert(!errorTypes.has(NotEnoughArgumentsError));
            assert(!errorTypes.has(TooManyArgumentsError));
        },
        expectError: {
            handle() { /* NOOP */ }
        }
    };
    yield {
        code: `{${[subtagName, ...codeParts.map(p => p[0] ? '{fail}' : '{eval}')].join(';')}}`,
        expected: '`Too many arguments`',
        errors: [
            ...codeParts.filter(p => !p[0]).map(p => p[1]),
            { start: 0, end: 9 + subtagName.length + 7 * maxArgCount, error: new TooManyArgumentsError(maxArgCount, maxArgCount + 1) }
        ]
    };
}
