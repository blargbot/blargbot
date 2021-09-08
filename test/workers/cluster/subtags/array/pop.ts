import { VariableCache } from '@cluster/bbtag';
import { PopSubtag } from '@cluster/subtags/array/pop';
import { describe } from 'mocha';
import { anyString, anything, deepEqual, instance, verify, when } from 'ts-mockito';

import { testExecute, testExecuteFail, testExecuteNotEnoughArgs, testExecuteTooManyArgs } from '../baseSubtagTests';

describe('{pop}', () => {
    const subtag = new PopSubtag();
    describe('#execute', () => {
        testExecuteNotEnoughArgs(subtag, [
            { args: [], expectedCount: 1 }
        ]);
        testExecuteFail(subtag, [
            { args: ['123'], error: 'Not an array' },
            { args: ['[123'], error: 'Not an array' }
        ]);
        testExecute(subtag, [
            {
                args: ['[]'],
                expected: '',
                details: {}
            },
            {
                args: ['{"n":"!arr","v":[]}'],
                expected: '',
                details: {}
            },
            {
                args: ['!arr'],
                expected: '9',
                details: { dbName: '!arr', get: [7, 8, 9], set: [7, 8] }
            },
            {
                args: ['["hi!"]'],
                expected: 'hi!',
                details: {}
            },
            {
                args: ['{"n":"@arr","v":[789]}'],
                expected: '789',
                details: { dbName: '@arr', set: [] }
            },
            {
                args: ['[1,2,3]'],
                expected: '3',
                details: {}
            },
            {
                args: ['{"n":"~arr","v":[1,2,3]}'],
                expected: '3',
                details: { dbName: '~arr', set: [1, 2] }
            },
            {
                args: ['~arr'],
                expected: '',
                details: { dbName: '~arr', get: [] }
            }
        ], {
            dbMock: VariableCache
        }, {
            arrange(ctx, _, __, details) {
                if (details.dbName !== undefined) {
                    when(ctx.contextMock.variables)
                        .thenReturn(instance(ctx.dbMock));

                    if (details.get !== undefined)
                        when(ctx.dbMock.get(details.dbName))
                            .thenResolve([...details.get]);

                    if (details.set !== undefined)
                        when(ctx.dbMock.set(details.dbName, deepEqual(details.set)))
                            .thenResolve();

                }
            },
            assert(ctx, _, __, details) {
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

                    if (details.set === undefined)
                        verify(ctx.dbMock.set(details.dbName, anything())).never();
                    else
                        verify(ctx.dbMock.set(details.dbName, deepEqual(details.set))).once();
                }
            }
        });
        testExecuteTooManyArgs(subtag, [
            { args: ['[1]', '[2]'], expectedCount: 1 }
        ]);
    });
});
