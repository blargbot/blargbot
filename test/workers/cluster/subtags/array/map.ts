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
                    undefined
                ],
                expected: '[]',
                details: { varSets: [], maxLoops: 10, loopChecks: 0 }
            },
            {
                args: [
                    '~var',
                    'this isnt an array',
                    undefined
                ],
                expected: '[]',
                details: { varSets: [], maxLoops: 10, loopChecks: 0 }
            },
            {
                args: [
                    '~abc',
                    '[1,2,3]',
                    ['A', 'B', 'C'] // return A, then B, then C
                ],
                expected: '["A","B","C"]',
                details: { varSets: [1, 2, 3], maxLoops: 10, loopChecks: 3 }
            },
            {
                args: [
                    '~def',
                    '{"n":"idk","v":[1,2,"3",4,5]}',
                    ['A', 'B', '1', '2', 'Z'] // return A, then B, then 1, then 2
                ],
                expected: '["A","B","1","2","Z"]',
                details: { varSets: [1, 2, '3', 4, 5], maxLoops: 5, loopChecks: 5 }
            },
            {
                title: 'Too many loops',
                args: [
                    '~def',
                    '{"n":"idk","v":[1,2,"3",4,5,6,7]}',
                    ['A', 'B', '1', '2', 'Z'] // return A, then B, then 1, then 2
                ],
                expected: '["A","B","1","2","Z","`Nope`"]',
                details: { varSets: [1, 2, '3', 4, 5], maxLoops: 5, loopChecks: 6 }
            }
        ], {
            limitMock: undefined as RuntimeLimit | undefined,
            dbMock: VariableCache
        }, {
            arrange(ctx, details, args, call) {
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
                when(ctx.dbMock.reset(args[0].value))
                    .thenResolve();

                for (const value of details.varSets)
                    when(ctx.dbMock.set(args[0].value, value))
                        .thenResolve();
            },
            assert(ctx, details, _, args, call) {
                verify(ctx.limitMock.check(instance(ctx.contextMock), call, 'map:loops'))
                    .times(details.loopChecks);
                verify(ctx.contextMock.eval(args[2].code))
                    .times(details.varSets.length);
                verify(ctx.stateMock.return)
                    .times(details.varSets.length);
                verify(ctx.dbMock.reset(args[0].value))
                    .times(details.varSets.length === 0 ? 0 : 1);

                for (const value of details.varSets)
                    verify(ctx.dbMock.set(args[0].value, value))
                        .once();
            }
        });
        testExecuteTooManyArgs(subtag, [
            { args: ['123', '456', '789', '121112'], expectedCount: 3 }
        ]);
    });
});
