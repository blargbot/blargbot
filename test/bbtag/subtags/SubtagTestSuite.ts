import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as inspector from 'node:inspector';
import path from 'node:path';
import type { TestContext } from 'node:test';
import { describe, it } from 'node:test';

import type { BBTagExpression, BBTagHooks, BBTagInput, BBTagRuntimeRootScope, FlagDefinition, LocatedRuntimeError, SourceMarker, SubtagCall } from '@blargbot/bbtag-engine';
import { bbtag, BBTagContext, BBTagRuntimeError, NotEnoughArgumentsError, Subtag, SubtagProvider, SubtagType, TooManyArgumentsError } from '@blargbot/bbtag-engine';
import type { Mockable, MockCtorArgs } from '@blargbot/test-util';
import { Mock } from '@blargbot/test-util';
import moment from 'moment-timezone';

import { createSnowflake } from '../snowflake.js';

type AnyConstructor<T> = (abstract new (...args: never) => T) & {
    readonly prototype: T;
}

export interface SubtagTestCase {
    readonly title?: string;
    readonly code: string;
    readonly subtagName?: string;
    readonly expected?: string | RegExp | (() => string | RegExp);
    readonly setup?: (context: SubtagTestContext, bbtag: BBTagExpression, nodeTest: TestContext) => Awaitable<void>;
    readonly assert?: (context: SubtagTestContext, result: string) => Awaitable<void>;
    readonly teardown?: (context: SubtagTestContext) => Awaitable<void>;
    readonly expectError?: {
        required?: boolean;
        handle: (error: unknown) => Awaitable<void>;
    };
    readonly errors?: ReadonlyArray<{ start?: number | SourceMarker; end?: number | SourceMarker; error: BBTagRuntimeError; }> | ((errors: LocatedRuntimeError[]) => void);
    readonly subtags?: readonly Subtag[];
    readonly skip?: boolean | (() => Awaitable<boolean>);
    readonly retries?: number;
    readonly timeout?: number;
}

interface TestSuiteConfig {
    readonly setup: Array<(context: SubtagTestContext, bbtag: BBTagExpression, nodeTest: TestContext) => Awaitable<void>>;
    readonly assert: Array<(context: SubtagTestContext, result: string) => Awaitable<void>>;
    readonly teardown: Array<(context: SubtagTestContext) => Awaitable<void>>;
}

export class MarkerError extends BBTagRuntimeError {
    public constructor(type: string, index: number) {
        super(`{${type}} called at ${index}`);
        this.display = '';
    }
}

export interface SubtagTestSuiteData<T extends Subtag = Subtag> extends Pick<SubtagTestCase, 'setup' | 'assert' | 'teardown'> {
    readonly names: Iterable<string>;
    readonly cases: SubtagTestCase[];
    readonly subtag: T;
    readonly otherSubtags?: Subtag[];
    readonly runOtherTests?: (subtag: T) => Promise<void>;
    readonly argCountBounds: { min: ArgCountBound; max: ArgCountBound; };
}

function makeId(name: string): string {
    return `${name}<${createSnowflake()}>`;
}

type ArgCountBound = number | { count: number; noEval: number[]; };

export class SubtagTestContext {
    readonly #allMocks: Mock[] = [];
    public readonly bbtag: BBTagContext;
    public readonly hooks = this.createMock<BBTagHooks>({ id: 'hooks' });
    public readonly root = this.createMock<BBTagRuntimeRootScope>({ id: 'root' });

    public guildId = makeId('guild');
    public messageId = makeId('commandMessage');
    public channelId = makeId('commandChannel');
    public userId = makeId('commandUser');
    public authorId: string | undefined = makeId('author');
    public authorizerId = makeId('authorizer');
    public botId = makeId('bot');
    public tagName = makeId('tagName');
    public isCC = false;
    public flagDefinitions: FlagDefinition[] = [];
    public prefix: string | undefined = undefined;
    public readonly input: Mutable<BBTagInput> = { array: [], flags: { _: '' } };
    public readonly ownedMessages = new Set<string>();

    public constructor(public readonly testCase: SubtagTestCase, subtags: Iterable<Subtag>) {
        this.bbtag = new BBTagContext(
            new SubtagProvider(subtags),
            this.hooks.instance,
            this.root.instance
        );
        this.hooks.setup((m, $) => m.internalServerError!($.anything)).invokes(i => {
            throw i.arguments[0];
        }, { isFallback: true });
        this.hooks.setup(m => m.step!()).returns(undefined, { isFallback: true });
        this.hooks.setup((m, $) => m.subtagExecuting!($.anything, $.anything)).returns(undefined, { isFallback: true });
        this.hooks.setup((m, $) => m.loop!($.anything)).returns(undefined, { isFallback: true });

        this.root.setup(m => m.guildId).invokes(() => this.guildId, { isFallback: true });
        this.root.setup(m => m.messageId).invokes(() => this.messageId, { isFallback: true });
        this.root.setup(m => m.channelId).invokes(() => this.channelId, { isFallback: true });
        this.root.setup(m => m.userId).invokes(() => this.userId, { isFallback: true });
        this.root.setup(m => m.authorId).invokes(() => this.authorId, { isFallback: true });
        this.root.setup(m => m.authorizerId).invokes(() => this.authorizerId, { isFallback: true });
        this.root.setup(m => m.botId).invokes(() => this.botId, { isFallback: true });
        this.root.setup(m => m.tagName).invokes(() => this.tagName, { isFallback: true });
        this.root.setup(m => m.isCC).invokes(() => this.isCC, { isFallback: true });
        this.root.setup(m => m.input).returns(this.input, { isFallback: true });
        this.root.setup(m => m.prefix).invokes(() => this.prefix, { isFallback: true });
        this.root.setup(m => m.ownedMessageIds).returns(this.ownedMessages, { isFallback: true });
        this.root.setup(m => m.recursion).returns({ depth: 0 }, { isFallback: true });
        this.root.setup(m => m.functions).returns(new Map(), { isFallback: true });
        this.root.setup(m => m.ccCache).returns(new Map(), { isFallback: true });
        this.root.setup(m => m.tagCache).returns(new Map(), { isFallback: true });
        this.root.setup(m => m.output).returns({ reactions: [] }, { isFallback: true });
        this.root.setup(m => m.queryCache).returns({
            channel: new Map(),
            role: new Map(),
            user: new Map(),
            failedQueries: 0
        }, { isFallback: true });
        this.root.setup(m => m.allowedMentions).returns({
            roles: new Set(),
            users: new Set(),
            everybody: false
        }, { isFallback: true });

        this.root.setupProperty('fallback', undefined);
        this.root.setupProperty('paramsarray', undefined);
        this.root.setupProperty('reactUser', undefined);
        this.root.setupProperty('reaction', undefined);
        this.root.setupProperty('quiet', undefined);
        this.root.setupProperty('noLookupErrors', undefined);
        this.root.setupProperty('silent', false);
    }

    public adoptMock(mock: Mock): void {
        this.#allMocks.push(mock);
        mock.reset();
    }

    public createMock<T extends Mockable>(...args: MockCtorArgs<T>): Mock<T> {
        const mock = new Mock<T>(...args);
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
}

export function createMockSubtag<T extends Subtag>(type: AnyConstructor<T>): Mock<T> {
    const mock = new Mock<T>(...[{ id: type.name }] as MockCtorArgs<T>);
    const clearInterceptors = mock.clearInterceptors.bind(mock);
    mock.clearInterceptors = () => {
        clearInterceptors();
        mock.setup(m => m.name).returns(`test-subtag-${createSnowflake()}`);
        mock.setup(m => m.aliases).returns([]);
        mock.setup(Reflect.getPrototypeOf).returns(type.prototype);
        mock.setup(m => m.constructor).returns(type);
    };
    mock.clearInterceptors();
    return mock;
}

export async function runSubtagTests<T extends Subtag>(data: SubtagTestSuiteData<T>): Promise<void> {
    const error = { stack: '' };
    Error.captureStackTrace(error, runSubtagTests);
    const stack = `Via SubtagTestSuite\n${error.stack.split('\n').slice(1).join('\n')}`;
    const suite = new SubtagTestSuite([data.subtag, ...data.otherSubtags ?? []], data.names);
    if (data.setup !== undefined)
        suite.setup(data.setup);
    if (data.assert !== undefined)
        suite.assert(data.assert);
    if (data.teardown !== undefined)
        suite.teardown(data.teardown);

    const min = typeof data.argCountBounds.min === 'number' ? { count: data.argCountBounds.min, noEval: [] } : data.argCountBounds.min;
    const max = typeof data.argCountBounds.max === 'number' ? { count: data.argCountBounds.max, noEval: [] } : data.argCountBounds.max;

    suite.addTestCases(notEnoughArgumentsTestCases(data.subtag.name, min.count, min.noEval));
    suite.addTestCases(data.cases);
    if (max.count < Infinity)
        suite.addTestCases(tooManyArgumentsTestCases(data.subtag.name, max.count, max.noEval));

    const runOtherTests = data.runOtherTests;
    await suite.run(stack, runOtherTests === undefined ? undefined : () => runOtherTests(data.subtag));

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

export function sourceMarker(location: number | SourceMarker, source: string): SourceMarker | undefined {
    if (typeof location === 'object')
        return location;

    const slice = source.slice(0, location);
    const lineStart = slice.lastIndexOf('\n');
    const lastLine = lineStart === -1 ? slice : slice.slice(lineStart + 1);
    const lineCount = slice.split('\n').length - 1;
    return { index: location, line: lineCount, column: lastLine.length };
}

abstract class TestSubtagBase extends Subtag {
    public category = SubtagType.SIMPLE;
    public hidden = true;
    public signatures = [];
    public aliases = [];
    public description = undefined;
    public deprecated = false;
    public staff = false;
}

export class TestDataSubtag extends TestSubtagBase {
    public name = 'testdata';
    public constructor(public readonly values: Record<string, string | undefined>) {
        super();
    }

    public async * execute(_: unknown, __: unknown, subtag: SubtagCall): AsyncIterable<string> {
        if (subtag.args.length !== 1)
            throw new RangeError(`Subtag ${this.name} must be given 1 argument!`);
        const key = subtag.args[0].source;
        const value = this.values[key];
        if (value === undefined)
            throw new RangeError(`Subtag ${this.name} doesnt have test data set up for ${JSON.stringify(value)}`);

        await Promise.resolve();
        yield value;
    }
}

export class EvalSubtag extends TestSubtagBase {
    public name = 'eval';

    public execute(_context: BBTagContext, _subtagName: string, subtag: SubtagCall): never {
        throw new MarkerError('eval', subtag.start.index);
    }
}

export class AssertSubtag extends TestSubtagBase {
    readonly #assertion: (context: BBTagContext, subtagName: string, subtag: SubtagCall) => Awaitable<string>;
    public name = 'assert';

    public constructor(assertion: (...args: Parameters<Subtag['execute']>) => Awaitable<string>) {
        super();
        this.#assertion = assertion;
    }

    public async * execute(context: BBTagContext, subtagName: string, subtag: SubtagCall): AsyncIterable<string> {
        yield await this.#assertion(context, subtagName, subtag);
    }
}

export class FailTestSubtag extends TestSubtagBase {
    public name = 'fail';

    public execute(_context: BBTagContext, _subtagName: string, subtag: SubtagCall): never {
        throw new RangeError(`Subtag ${subtag.source} was evaluated when it wasnt supposed to!`);
    }
}

export class LimitedTestSubtag extends TestSubtagBase {
    readonly #counts = new WeakMap<BBTagContext, number>();
    readonly #limit: number;
    public name = 'limit';

    public constructor(limit = 1) {
        super();
        this.#limit = limit;
    }

    public execute(context: BBTagContext): never {
        const count = this.#counts.get(context) ?? 0;
        this.#counts.set(context, count + 1);

        if (count >= this.#limit)
            throw new Error(`Subtag {limit} cannot be called more than ${this.#limit} time(s)`);
        throw new MarkerError('limit', count + 1);
    }
}

export class EchoArgsSubtag extends TestSubtagBase {
    public name = 'echoargs';
    public async * execute(_: BBTagContext, __: string, subtag: SubtagCall): AsyncIterable<string> {
        await Promise.resolve();
        yield '[';
        yield JSON.stringify(subtag.name.source);
        for (const arg of subtag.args) {
            yield ',';
            yield JSON.stringify(arg.source);
        }
        yield ']';
    }
}

export class SubtagTestSuite {
    readonly #config: TestSuiteConfig = { setup: [], assert: [], teardown: [] };
    readonly #testCases: SubtagTestCase[] = [];
    readonly #subtags: Subtag[];
    readonly #names: Iterable<string>;

    public constructor(subtags: Subtag[], names: Iterable<string>) {
        this.#subtags = subtags;
        this.#names = names;
    }

    public setup(setup: TestSuiteConfig['setup'][number]): this {
        this.#config.setup.push(setup);
        return this;
    }

    public assert(assert: TestSuiteConfig['assert'][number]): this {
        this.#config.assert.push(assert);
        return this;

    }

    public teardown(teardown: TestSuiteConfig['teardown'][number]): this {
        this.#config.teardown.push(teardown);
        return this;
    }

    public addTestCase(...testCases: SubtagTestCase[]): this {
        return this.addTestCases(testCases);
    }

    public addTestCases(testCases: Iterable<SubtagTestCase>): this {
        for (const testCase of testCases)
            this.#testCases.push(testCase);
        return this;
    }

    public async run(stack: string, otherTests?: () => Promise<void>): Promise<void> {
        const subtag = this.#subtags[0];
        await describe(`{${subtag.name}}`, async () => {
            const config = this.#config;
            await it(`Should have [${Iterator.from(this.#names).map(x => JSON.stringify(x)).toArray().join(',')}] as names`, () => {
                try {
                    const expectedNames = new Set(this.#names);
                    assert(expectedNames.size > 0);
                    const subtagNames = new Set(subtag.aliases);
                    subtagNames.add(subtag.name);
                    assert.deepEqual(subtagNames, expectedNames);
                } catch (error) {
                    if (error instanceof Error)
                        error.stack += `\n${stack}`;
                    throw error;
                }
            });

            for (const testCase of this.#testCases) {
                const retries = Math.max(testCase.retries ?? 0, 0);
                const timeout = testCase.timeout === undefined ? undefined : (retries + 1) * testCase.timeout;
                await it(getTestName(testCase), { skip: await shouldSkip(testCase), timeout }, async t => {
                    for (let attempt = 0; attempt < retries; attempt++) {
                        try {
                            await runTestCase(this.#subtags, testCase, config, t);
                            return;
                        } catch {
                            t.mock.reset();
                            /* NO-OP */
                        }
                    }
                    try {
                        await runTestCase(this.#subtags, testCase, config, t);
                    } catch (error) {
                        if (error instanceof Error)
                            error.stack += `\n${stack}`;
                        throw error;
                    }
                });
            }

            if (otherTests !== undefined)
                await otherTests();
        });
    }
}

function getTestName(testCase: SubtagTestCase): string {
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
            const errorStr = errorCount === 0 ? undefined : `${errorCount} ${errorCount === 1 ? 'error' : 'errors'}`;
            const markerStr = markerCount === 0 ? undefined : `${markerCount} ${markerCount === 1 ? 'marker' : 'markers'}`;
            result += ` with ${[markerStr, errorStr].filter(x => x !== undefined).join(' and ')}`;
        }
    }

    if (testCase.title !== undefined)
        result += ` - ${testCase.title}`;

    return result;
}

async function shouldSkip(testCase: SubtagTestCase): Promise<boolean> {
    return typeof testCase.skip === 'boolean' ? testCase.skip : await testCase.skip?.() ?? false;
}

async function runTestCase<TestCase extends SubtagTestCase>(subtags: Subtag[], testCase: TestCase, config: TestSuiteConfig, testCtx: TestContext): Promise<void> {
    subtags = [...subtags, new EvalSubtag(), new FailTestSubtag(), ...testCase.subtags ?? []];
    const test = new SubtagTestContext(testCase, subtags);
    const actualTestCase = Object.create(testCase, { 'timestamp': { value: moment() } });

    try {
        // arrange
        const code = bbtag.parse(testCase.code);
        for (const setup of config.setup)
            await setup(test, code, testCtx);
        await actualTestCase.setup?.(test, code, testCtx);

        test.ownedMessages.add(test.messageId);

        const expected = getExpectation(testCase);

        // act
        const result = await runSafe(() => test.bbtag.eval(code));
        if (!result.success) {
            if (actualTestCase.expectError === undefined)
                throw result.error;
            await actualTestCase.expectError.handle(result.error);
            return;
        } else if (actualTestCase.expectError?.required === true) {
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

        await actualTestCase.assert?.(test, result.value);
        for (const assert of config.assert)
            await assert.call(actualTestCase, test, result.value);

        if (typeof testCase.errors === 'function') {
            testCase.errors(test.bbtag.errors);
        } else {
            const errors = test.bbtag.errors.map(err => ({
                error: noStack(err.error),
                start: err.subtag?.start,
                end: err.subtag?.end
            }));
            const expected = testCase.errors?.map(err => ({
                error: noStack(err.error),
                start: sourceMarker(err.start ?? 0, testCase.code),
                end: sourceMarker(err.end ?? testCase.code.length, testCase.code)
            })) ?? [];
            assert.deepEqual(errors, expected);
        }
        test.verifyAll();
    } finally {
        for (const teardown of config.teardown)
            await teardown.call(actualTestCase, test);
    }
}

async function runSafe<T>(action: () => Awaitable<T>): Promise<{ success: true; value: T; } | { success: false; error: unknown; }> {
    try {
        return { success: true, value: await action() };
    } catch (err: unknown) {
        return { success: false, error: err };
    }
}

function noStack(error: unknown): unknown {
    if (!(error instanceof Error))
        return error;

    const result = Object.create(Reflect.getPrototypeOf(error)) as Error;
    for (const property of Reflect.ownKeys(error)) {
        const descriptor = Reflect.getOwnPropertyDescriptor(error, property);
        if (descriptor === undefined)
            continue;
        if (property === 'stack')
            descriptor.value = error.stack?.replaceAll(/(?<=\n)(?: {4}at [^\n]+(?:\n|$))+/gs, '<stack ignored>');
        else if (property === 'cause')
            descriptor.value = noStack(descriptor.value);
        if ('get' in descriptor && 'value' in descriptor) {
            descriptor.writable = 'set' in descriptor;
            delete descriptor.get;
            delete descriptor.set;
        }
        Reflect.defineProperty(result, property, descriptor);
    }
    return result;
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
function getExpectation(testCase: SubtagTestCase): Exclude<SubtagTestCase['expected'], Function> {
    if (typeof testCase.expected === 'function')
        return testCase.expected();
    return testCase.expected;
}

export function* notEnoughArgumentsTestCases(subtagName: string, minArgCount: number, noEval: number[]): Generator<SubtagTestCase> {
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
                { error: new NotEnoughArgumentsError(minArgCount, i) }
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

export function* tooManyArgumentsTestCases(subtagName: string, maxArgCount: number, noEval: number[]): Generator<SubtagTestCase> {
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
            { error: new TooManyArgumentsError(maxArgCount, maxArgCount + 1) }
        ]
    };
}
