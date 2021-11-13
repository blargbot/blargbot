import { BBTagContext, Subtag } from '@cluster/bbtag';
import { BBTagRuntimeError, NotEnoughArgumentsError, TooManyArgumentsError } from '@cluster/bbtag/errors';
import { BBTagContextState, Statement, SubtagCall, SubtagLogic, SubtagResult } from '@cluster/types';
import { expect } from 'chai';
import { it } from 'mocha';
import { instance, mock, when } from 'ts-mockito';

interface ArgRef {
    code: Statement;
    resolveOrder: undefined | string[];
    value: string;
}

interface HandleConfig<AutoMock extends Record<string, unknown>, Details, Result> {
    arrange?: (context: HandleContext<AutoMock>, details: Details, args: readonly ArgRef[], subtag: SubtagCall) => Awaitable<void>;
    assert?: (context: HandleContext<AutoMock>, details: Details, result: Result, args: readonly ArgRef[], subtag: SubtagCall) => Awaitable<void>;
}

type TestCases<Details, T extends Record<string, unknown>> = ReadonlyArray<TestCase<Details, T>>;

type TestCase<Details, T extends Record<string, unknown>> =
    & { args: ReadonlyArray<string | string[] | undefined>; }
    & (Details extends undefined ? { details?: Details; } : { details: Details; })
    & T

type HandleContext<AutoMock extends Record<string, unknown>> =
    & {
        contextMock: BBTagContext;
        stateMock: BBTagContextState;
    } & {
        [P in keyof AutoMock]: AutoMock[P] extends abstract new (...args: infer _) => infer R ? R : Exclude<AutoMock[P], undefined>
    }

export function testExecuteNotEnoughArgs<Details = undefined, AutoMock extends Record<string, unknown> = Record<string, never>>(
    subtag: Subtag,
    cases: TestCases<Details, { expectedCount: number; }>,
    automock?: AutoMock,
    options?: HandleConfig<AutoMock, Details, Error>
): void {
    testExecuteFail(
        subtag,
        cases.map(_case => ({
            ..._case,
            error: new NotEnoughArgumentsError(_case.expectedCount, _case.args.length)
        })),
        automock,
        options
    );
}

export function testExecuteTooManyArgs<Details = undefined, AutoMock extends Record<string, unknown> = Record<string, never>>(
    subtag: Subtag,
    cases: TestCases<Details, { expectedCount: number; }>,
    automock?: AutoMock,
    options?: HandleConfig<AutoMock, Details, Error>
): void {
    testExecuteFail(
        subtag,
        cases.map(_case => ({
            ..._case,
            error: new TooManyArgumentsError(_case.expectedCount, _case.args.length)
        })),
        automock,
        options
    );
}

export function testExecuteFail<Details = undefined, AutoMock extends Record<string, unknown> = Record<string, never>>(
    subtag: Subtag,
    cases: TestCases<Details, { error: BBTagRuntimeError; }>,
    automock?: AutoMock,
    options?: HandleConfig<AutoMock, Details, Error>
): void {
    for (const testCase of cases) {
        testExecute(subtag, [{ ...testCase, expected: testCase.error, title: testCase.error.message }], automock, options);
    }
}

export function testExecute<Details = undefined, AutoMock extends Record<string, unknown> = Record<string, never>, Result = SubtagLogic<SubtagResult>>(
    subtag: Subtag,
    cases: TestCases<Details, { expected?: Result; title?: string; }>,
    automock?: AutoMock,
    options?: HandleConfig<AutoMock, Details, Result>
): void {
    for (const testCase of cases) {
        const title = testCase.title !== undefined ? ` - ${testCase.title}` : '';
        it(`Should handle {${[subtag.name, ...testCase.args.map(arg => Array.isArray(arg) ? arg[0] : arg ?? '')].join(';')}}${title}`,
            subtagInvokeTestCase(subtag, automock, options ?? {}, testCase));
    }
}

function subtagInvokeTestCase<Details = undefined, AutoMock extends Record<string, unknown> = Record<string, never>, Result = SubtagLogic<SubtagResult>>(
    subtag: Subtag,
    automock: AutoMock | undefined,
    options: HandleConfig<AutoMock, Details, Result>,
    testCase: TestCase<Details, { expected?: Result; }>
): () => Promise<void> {
    return async () => {
        // arrange
        const context = <HandleContext<AutoMock>>Object.fromEntries([
            ['contextMock', mock(BBTagContext)] as const,
            ['stateMock', mock<BBTagContextState>()] as const,
            ...Object.entries(automock ?? {})
                .map(e => [e[0], mock(e[1])] as const)
        ]);

        const argRefs = testCase.args.map<ArgRef>((arg, i) => ({
            code: [`ARG${i}`],
            get resolveOrder() {
                switch (typeof arg) {
                    case 'undefined': return undefined;
                    case 'string': return [arg];
                    default: return arg;
                }
            },
            get value() {
                switch (typeof arg) {
                    case 'undefined': throw new Error('Arg should never resolve!');
                    case 'string': return arg;
                    default: return arg[0];
                }
            }
        }));

        const call: SubtagCall = {
            name: ['concat'],
            args: argRefs.map(r => r.code),
            start: { column: 0, index: 0, line: 0 },
            end: { column: 0, index: 0, line: 0 },
            source: ''
        };

        when(context.contextMock.state)
            .thenReturn(instance(context.stateMock));
        when(context.stateMock.subtags)
            .thenReturn({});

        for (const arg of argRefs) {
            if (arg.resolveOrder !== undefined) {
                const iter = arg.resolveOrder[Symbol.iterator]();
                when(context.contextMock.eval(arg.code))
                    .thenCall(() => {
                        const next = iter.next();
                        if (next.done === true)
                            throw new Error('Values are exhausted!');
                        return next.value;
                    });
            }
        }

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        options.arrange?.(context, testCase.details!, argRefs, call);

        // act
        let result;
        if (testCase.expected instanceof Error) {
            try {
                await joinResults(subtag.execute(instance(context.contextMock), subtag.name, call));
                throw new Error(`Expected ${testCase.expected.constructor.name} to be thrown, but no error was thrown.`);
            } catch (err: unknown) {
                result = err;
            }
        } else {
            result = await joinResults(subtag.execute(instance(context.contextMock), subtag.name, call));
        }

        // asssert
        if ('expected' in testCase) {
            if (testCase.expected instanceof Error) {
                expect(result).to.be.instanceOf(testCase.expected.constructor);
                expect({ ...<Error>result, message: (<Error>result).message }).to.deep.equal({ ...testCase.expected, message: testCase.expected.message });
            } else {
                expect(result).to.equal(testCase.expected);
            }
        }
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        options.assert?.(context, testCase.details!, <Result>result, argRefs, call);
    };
}

async function joinResults(values: SubtagResult): Promise<string> {
    const results = [];
    for await (const value of values)
        if (value !== undefined)
            results.push(value);
    return results.join('');
}
