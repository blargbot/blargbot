import { VariableCache } from '@cluster/bbtag';
import { MapSubtag } from '@cluster/subtags/array/map';
import { RuntimeLimit } from '@cluster/types';
import { describe } from 'mocha';
import { instance, verify, when } from 'ts-mockito';

import { testExecute, testExecuteNotEnoughArgs, testExecuteTooManyArgs } from '../baseSubtagTests';

describe('{map}', () => {
    const subtag = new MapSubtag();
    describe('#execute', () => {
        testExecuteNotEnoughArgs(subtag, [
            { args: [], expectedCount: 3 },
            { args: ['a'], expectedCount: 3 },
            { args: ['a', 'b'], expectedCount: 3 }
        ]);
        testExecute(subtag, [
            {
                args: [
                    '~var',
                    '[]',
                    'A'
                ],
                expected: '[]',
                details: { values: [], maxLoops: 10, loopChecks: 0 }
            },
            {
                args: [
                    '~abc',
                    '[1,2,3]',
                    ['A', 'B', 'C'] // return A, then B, then C
                ],
                expected: '["A","B","C"]',
                details: { values: [1, 2, 3], maxLoops: 10, loopChecks: 3 }
            },
            {
                args: [
                    '~def',
                    '{"n":"idk","v":[1,2,"3",4,5]}',
                    ['A', 'B', '1', '2'] // return A, then B, then 1, then 2
                ],
                expected: '["A","B","1","2","2"]',
                details: { values: [1, 2, '3', 4, 5], maxLoops: 5, loopChecks: 5 }
            },
            {
                title: 'Too many loops',
                args: [
                    '~def',
                    '{"n":"idk","v":[1,2,"3",4,5,6,7]}',
                    ['A', 'B', '1', '2'] // return A, then B, then 1, then 2
                ],
                expected: '["A","B","1","2","2","`Nope`"]',
                details: { values: [1, 2, '3', 4, 5], maxLoops: 5, loopChecks: 6 }
            }
        ], {
            limitMock: undefined as RuntimeLimit | undefined,
            dbMock: VariableCache
        }, {
            arrange(ctx, args, call, details) {
                const checkResults: Array<undefined | string> = [undefined];
                checkResults[details.maxLoops] = '`Nope`';

                when(ctx.stateMock.return)
                    .thenReturn(0);
                when(ctx.contextMock.limit)
                    .thenReturn(instance(ctx.limitMock));
                when(ctx.limitMock.check(instance(ctx.contextMock), call, 'map:loops'))
                    .thenReturn(...checkResults);
                when(ctx.contextMock.variables)
                    .thenReturn(instance(ctx.dbMock));
                when(ctx.dbMock.reset(args[0].values[0]))
                    .thenResolve();

                for (const value of details.values)
                    when(ctx.dbMock.set(args[0].values[0], value))
                        .thenResolve();
            },
            assert(ctx, args, call, details) {
                verify(ctx.limitMock.check(instance(ctx.contextMock), call, 'map:loops'))
                    .times(details.loopChecks);
                verify(ctx.contextMock.eval(args[2].code))
                    .times(details.values.length);
                verify(ctx.stateMock.return)
                    .times(details.values.length);
                verify(ctx.dbMock.reset(args[0].values[0]))
                    .once();

                for (const value of details.values)
                    verify(ctx.dbMock.set(args[0].values[0], value))
                        .once();
            }
        });
        testExecuteTooManyArgs(subtag, [
            { args: ['123', '456', '789', '121112'], expectedCount: 3 }
        ]);
    });
});
