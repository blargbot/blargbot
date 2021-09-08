import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { BBTagContextState, Statement, SubtagCall, SubtagResult } from '@cluster/types';
import { snowflake } from '@core/utils';
import { expect } from 'chai';
import { it } from 'mocha';
import { instance, mock, verify, when } from 'ts-mockito';

interface ArgRef {
    code: Statement;
    resolveOrder: undefined | string[];
    value: string;
}

interface HandleConfig<AutoMock extends Record<string, unknown>, Details> {
    arrange?: (context: HandleContext<AutoMock>, args: readonly ArgRef[], subtag: SubtagCall, details: Details) => Awaitable<void>;
    assert?: (context: HandleContext<AutoMock>, args: readonly ArgRef[], subtag: SubtagCall, details: Details) => Awaitable<void>;
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
    subtag: BaseSubtag,
    cases: TestCases<Details, { debugMessage?: string; expectedCount?: number; }>,
    automock?: AutoMock,
    options?: HandleConfig<AutoMock, Details>
): void {
    testExecuteFail(
        subtag,
        cases.map(_case => ({
            ..._case,
            error: 'Not enough arguments',
            debugMessage: _case.debugMessage ?? (_case.expectedCount !== undefined
                ? `Expected at least ${_case.expectedCount} arguments but got ${_case.args.length}`
                : undefined)
        })),
        automock,
        options
    );
}

export function testExecuteTooManyArgs<Details = undefined, AutoMock extends Record<string, unknown> = Record<string, never>>(
    subtag: BaseSubtag,
    cases: TestCases<Details, { debugMessage?: string; expectedCount?: number; }>,
    automock?: AutoMock,
    options?: HandleConfig<AutoMock, Details>
): void {
    testExecuteFail(
        subtag,
        cases.map(_case => ({
            ..._case,
            error: 'Too many arguments',
            debugMessage: _case.debugMessage ?? (_case.expectedCount !== undefined
                ? `Expected ${_case.expectedCount} arguments or fewer but got ${_case.args.length}`
                : undefined)
        })),
        automock,
        options
    );
}

export function testExecuteFail<Details = undefined, AutoMock extends Record<string, unknown> = Record<string, never>>(
    subtag: BaseSubtag,
    cases: TestCases<Details, { debugMessage?: string; error: string; }>,
    automock?: AutoMock,
    options?: HandleConfig<AutoMock, Details>
): void {
    for (const testCase of cases) {
        const expected = `[${snowflake.create().toString()}]This test should have failed with the error ${testCase.error}`;
        const newOptions: HandleConfig<AutoMock, Details> = {
            arrange(ctx, args, call, details) {
                when(ctx.contextMock.addError(testCase.error, call, testCase.debugMessage))
                    .thenReturn(expected);
                options?.arrange?.(ctx, args, call, details);
            },
            assert(ctx, args, call, details) {
                verify(ctx.contextMock.addError(testCase.error, call, testCase.debugMessage))
                    .once();
                options?.assert?.(ctx, args, call, details);
            }
        };
        testExecute(subtag, [{ ...testCase, expected, title: testCase.error }], automock, newOptions);
    }
}

export function testExecute<Details = undefined, AutoMock extends Record<string, unknown> = Record<string, never>>(
    subtag: BaseSubtag,
    cases: TestCases<Details, { expected: SubtagResult; title?: string; }>,
    automock?: AutoMock,
    options?: HandleConfig<AutoMock, Details>
): void {
    for (const testCase of cases) {
        const title = testCase.title !== undefined ? ` - ${testCase.title}` : '';
        it(`Should handle {${[subtag.name, ...testCase.args.map(arg => Array.isArray(arg) ? arg[0] : arg ?? '')].join(';')}}${title}`,
            subtagInvokeTestCase(subtag, automock, options ?? {}, testCase));
    }
}

function subtagInvokeTestCase<Details = undefined, AutoMock extends Record<string, unknown> = Record<string, never>>(
    subtag: BaseSubtag,
    automock: AutoMock | undefined,
    options: HandleConfig<AutoMock, Details>,
    testCase: TestCase<Details, { expected: SubtagResult; }>
): () => Promise<void> {
    const { args, expected, details } = testCase;
    return async () => {
        // arrange
        const context = <HandleContext<AutoMock>>Object.fromEntries([
            ['contextMock', mock(BBTagContext)] as const,
            ['stateMock', mock<BBTagContextState>()] as const,
            ...Object.entries(automock ?? {})
                .map(e => [e[0], mock(e[1])] as const)
        ]);

        const argRefs = args.map<ArgRef>((arg, i) => ({
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
        options.arrange?.(context, argRefs, call, details!);

        // act
        const result = await subtag.execute(instance(context.contextMock), subtag.name, call);

        // asssert
        expect(result).to.equal(expected);
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        options.assert?.(context, argRefs, call, details!);
    };
}
