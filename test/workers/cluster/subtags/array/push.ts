import { VariableCache } from '@cluster/bbtag';
import { NotAnArrayError } from '@cluster/bbtag/errors';
import { PushSubtag } from '@cluster/subtags/array/push';
import { describe } from 'mocha';
import { anyString, anything, deepEqual, instance, verify, when } from 'ts-mockito';

import { testExecute, testExecuteFail, testExecuteNotEnoughArgs } from '../baseSubtagTests';

describe('{push}', () => {
    const subtag = new PushSubtag();
    describe('#execute', () => {
        testExecuteNotEnoughArgs(subtag, [
            { args: [], expectedCount: 2 },
            { args: ['~arg'], expectedCount: 2 }
        ]);
        testExecuteFail(subtag, [
            { args: ['123', ''], error: new NotAnArrayError('123') },
            { args: ['[123', ''], error: new NotAnArrayError('[123') }
        ]);
        testExecute(subtag, [
            {
                args: ['[]', 'A'],
                expected: '["A"]',
                details: {}
            },
            {
                args: ['[]', 'A', 'B'],
                expected: '["A","B"]',
                details: {}
            },
            {
                args: ['[]', 'A', 'B', 'C'],
                expected: '["A","B","C"]',
                details: {}
            },
            {
                args: ['[1]', 'A'],
                expected: '[1,"A"]',
                details: {}
            },
            {
                args: ['[1]', 'A', 'B'],
                expected: '[1,"A","B"]',
                details: {}
            },
            {
                args: ['[1]', 'A', 'B', 'C'],
                expected: '[1,"A","B","C"]',
                details: {}
            },
            {
                args: ['~arr', 'A'],
                expected: undefined,
                details: { dbName: '~arr', get: [], set: ['A'] }
            },
            {
                args: ['~arr', 'A', 'B'],
                expected: undefined,
                details: { dbName: '~arr', get: [], set: ['A', 'B'] }
            },
            {
                args: ['~arr', 'A', 'B', 'C'],
                expected: undefined,
                details: { dbName: '~arr', get: [], set: ['A', 'B', 'C'] }
            },
            {
                args: ['~arr', 'A'],
                expected: undefined,
                details: { dbName: '~arr', get: [1, 2], set: [1, 2, 'A'] }
            },
            {
                args: ['~arr', 'A', 'B'],
                expected: undefined,
                details: { dbName: '~arr', get: [1, 2], set: [1, 2, 'A', 'B'] }
            },
            {
                args: ['~arr', 'A', 'B', 'C'],
                expected: undefined,
                details: { dbName: '~arr', get: [1, 2], set: [1, 2, 'A', 'B', 'C'] }
            },
            {
                args: ['{"n":"!arr","v":[]}', 'A'],
                expected: undefined,
                details: { dbName: '!arr', set: ['A'] }
            },
            {
                args: ['{"n":"!arr","v":[]}', 'A', 'B'],
                expected: undefined,
                details: { dbName: '!arr', set: ['A', 'B'] }
            },
            {
                args: ['{"n":"!arr","v":[]}', 'A', 'B', 'C'],
                expected: undefined,
                details: { dbName: '!arr', set: ['A', 'B', 'C'] }
            },
            {
                args: ['{"n":"!arr","v":[1,2]}', 'A'],
                expected: undefined,
                details: { dbName: '!arr', set: [1, 2, 'A'] }
            },
            {
                args: ['{"n":"!arr","v":[1,2]}', 'A', 'B'],
                expected: undefined,
                details: { dbName: '!arr', set: [1, 2, 'A', 'B'] }
            },
            {
                args: ['{"n":"!arr","v":[1,2]}', 'A', 'B', 'C'],
                expected: undefined,
                details: { dbName: '!arr', set: [1, 2, 'A', 'B', 'C'] }
            }
        ], {
            dbMock: VariableCache
        }, {
            arrange(ctx, details) {
                if (details.dbName !== undefined) {
                    when(ctx.contextMock.variables)
                        .thenReturn(instance(ctx.dbMock));

                    if (details.get !== undefined)
                        when(ctx.dbMock.get(details.dbName))
                            .thenResolve([...details.get]);

                    when(ctx.dbMock.set(details.dbName, deepEqual(details.set)))
                        .thenResolve();

                }
            },
            assert(ctx, details) {
                if (details.dbName === undefined) {
                    verify(ctx.dbMock.get(anyString()))
                        .never();
                    verify(ctx.dbMock.set(anyString(), anything()))
                        .never();
                } else {
                    if (details.get === undefined)
                        verify(ctx.dbMock.get(details.dbName)).never();
                    else
                        verify(ctx.dbMock.get(details.dbName)).once();

                    verify(ctx.dbMock.set(details.dbName, deepEqual(details.set))).once();
                }
            }
        });
    });
});
