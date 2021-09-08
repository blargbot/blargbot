import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { BBTagContextState, SubtagCall } from '@cluster/types';
import { expect } from 'chai';
import { it } from 'mocha';
import { instance, mock, verify, when } from 'ts-mockito';

interface HandleConfig<AutoMock extends Record<string, unknown>> {
    arrange?: (context: HandleContext<AutoMock>) => Awaitable<void>;
    assert?: (context: HandleContext<AutoMock>) => Awaitable<void>;
}

type HandleContext<AutoMock extends Record<string, unknown>> =
    & {
        contextMock: BBTagContext;
        stateMock: BBTagContextState;
    } & {
        [P in keyof AutoMock]: AutoMock[P] extends abstract new (...args: infer _) => infer R ? R : Exclude<AutoMock[P], undefined>
    }

export function testExecuteNotEnoughArgs<AutoMock extends Record<string, unknown> = Record<string, never>>(
    subtag: BaseSubtag,
    cases: Array<{ args: string[]; debugMessage?: string; expectedCount?: number; }>,
    automock?: AutoMock,
    options?: HandleConfig<AutoMock>
): void {
    testExecuteFail(
        subtag,
        cases.map(_case => ({
            args: _case.args,
            error: 'Not enough arguments',
            debugMessage: _case.debugMessage ?? (_case.expectedCount !== undefined
                ? `Expected at least ${_case.expectedCount} arguments but got ${_case.args.length}`
                : undefined)
        })),
        automock,
        options
    );
}

export function testExecuteTooManyArgs<AutoMock extends Record<string, unknown> = Record<string, never>>(
    subtag: BaseSubtag,
    cases: Array<{ args: string[]; debugMessage?: string; expectedCount?: number; }>,
    automock?: AutoMock,
    options?: HandleConfig<AutoMock>
): void {
    testExecuteFail(
        subtag,
        cases.map(_case => ({
            args: _case.args,
            error: 'Too many arguments',
            debugMessage: _case.debugMessage ?? (_case.expectedCount !== undefined
                ? `Expected ${_case.expectedCount} arguments or fewer but got ${_case.args.length}`
                : undefined)
        })),
        automock,
        options
    );
}

export function testExecuteFail<AutoMock extends Record<string, unknown> = Record<string, never>>(
    subtag: BaseSubtag,
    cases: Array<{ args: string[]; debugMessage?: string; error: string; }>,
    automock?: AutoMock,
    options?: HandleConfig<AutoMock>
): void {
    for (const { args, debugMessage, error } of cases) {
        it(`Should handle {${[subtag.name, ...args].join(';')}} - ${error}`, async () => {
            // arrange
            const context = <HandleContext<AutoMock>>Object.fromEntries([
                ['contextMock', mock(BBTagContext)] as const,
                ['stateMock', mock<BBTagContextState>()] as const,
                ...Object.entries(automock ?? {})
                    .map(e => [e[0], mock(e[1])] as const)
            ]);
            const wrappedArgs = args.map(arg => [arg]);
            const call: SubtagCall = {
                name: ['concat'],
                args: wrappedArgs,
                start: { column: 0, index: 0, line: 0 },
                end: { column: 0, index: 0, line: 0 },
                source: ''
            };

            when(context.contextMock.state).thenReturn(instance(context.stateMock));
            when(context.stateMock.subtags).thenReturn({});
            when(context.contextMock.addError(error, call, debugMessage)).thenReturn('SUCCESS');
            for (const arg of wrappedArgs)
                when(context.contextMock.eval(arg)).thenResolve(arg[0]);

            options?.arrange?.(context);

            // act
            const result = await subtag.execute(instance(context.contextMock), subtag.name, call);

            // asssert
            expect(result).to.equal('SUCCESS');
            verify(context.contextMock.addError(error, call, debugMessage)).once();
            options?.assert?.(context);
        });
    }
}

export function testExecute<AutoMock extends Record<string, unknown> = Record<string, never>>(
    subtag: BaseSubtag,
    cases: Array<{ args: string[]; expected: string; }>,
    automock?: AutoMock,
    options?: HandleConfig<AutoMock>
): void {
    for (const { args, expected } of cases) {
        it(`Should handle {${[subtag.name, ...args].join(';')}}`, async () => {
            // arrange
            const context = <HandleContext<AutoMock>>Object.fromEntries([
                ['contextMock', mock(BBTagContext)] as const,
                ['stateMock', mock<BBTagContextState>()] as const,
                ...Object.entries(automock ?? {})
                    .map(e => [e[0], mock(e[1])] as const)
            ]);
            const wrappedArgs = args.map(arg => [arg]);
            const call: SubtagCall = {
                name: ['concat'],
                args: wrappedArgs,
                start: { column: 0, index: 0, line: 0 },
                end: { column: 0, index: 0, line: 0 },
                source: ''
            };

            when(context.contextMock.state).thenReturn(instance(context.stateMock));
            when(context.stateMock.subtags).thenReturn({});
            for (const arg of wrappedArgs)
                when(context.contextMock.eval(arg)).thenResolve(arg[0]);

            options?.arrange?.(context);

            // act
            const result = await subtag.execute(instance(context.contextMock), subtag.name, call);

            // asssert
            expect(result).to.equal(expected);
            options?.assert?.(context);
        });
    }
}
