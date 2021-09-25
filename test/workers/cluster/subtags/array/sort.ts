import { VariableCache } from '@cluster/bbtag';
import { SortSubtag } from '@cluster/subtags/array/sort';
import { describe } from 'mocha';
import { deepEqual, instance, verify, when } from 'ts-mockito';

import { testExecute, testExecuteNotEnoughArgs, testExecuteTooManyArgs } from '../baseSubtagTests';

describe('{sort}', () => {
    const subtag = new SortSubtag();
    describe('#execute', () => {
        testExecuteNotEnoughArgs(subtag, [
            { args: [], expectedCount: 1 }
        ]);
        testExecute(subtag, [
            {
                args: ['[5,4,3,7,8,2,1,9,6]'],
                expected: '[1,2,3,4,5,6,7,8,9]',
                details: {}
            },
            {
                args: ['[5,4,3,7,8,2,1,9,6]', 'false'],
                expected: '[1,2,3,4,5,6,7,8,9]',
                details: {}
            },
            {
                args: ['[5,4,3,7,8,2,1,9,6]', 'true'],
                expected: '[9,8,7,6,5,4,3,2,1]',
                details: {}
            },
            {
                args: ['[5,4,3,7,8,2,1,9,6]', 'qwerety'],
                expected: '[9,8,7,6,5,4,3,2,1]',
                details: {}
            },
            {
                args: ['["testing","test","456test","4test",99999,"abc678def","abc4def"]'],
                expected: '["4test","456test",99999,"abc4def","abc678def","test","testing"]',
                details: {}
            },
            {
                args: ['["testing","test","456test","4test",99999,"abc678def","abc4def"]', 'false'],
                expected: '["4test","456test",99999,"abc4def","abc678def","test","testing"]',
                details: {}
            },
            {
                args: ['["testing","test","456test","4test",99999,"abc678def","abc4def"]', 'true'],
                expected: '["testing","test","abc678def","abc4def",99999,"456test","4test"]',
                details: {}
            },
            {
                args: ['["testing","test","456test","4test",99999,"abc678def","abc4def"]', 'woijaowd'],
                expected: '["testing","test","abc678def","abc4def",99999,"456test","4test"]',
                details: {}
            },
            {
                args: ['{"n":"~arr","v":["testing","test","456test","4test",99999,"abc678def","abc4def"]}'],
                expected: undefined,
                details: {
                    dbName: '~arr',
                    set: ['4test', '456test', 99999, 'abc4def', 'abc678def', 'test', 'testing']
                }
            },
            {
                args: ['{"n":"~arr","v":["testing","test","456test","4test",99999,"abc678def","abc4def"]}', 'false'],
                expected: undefined,
                details: {
                    dbName: '~arr',
                    set: ['4test', '456test', 99999, 'abc4def', 'abc678def', 'test', 'testing']
                }
            },
            {
                args: ['{"n":"~arr","v":["testing","test","456test","4test",99999,"abc678def","abc4def"]}', 'true'],
                expected: undefined,
                details: {
                    dbName: '~arr',
                    set: ['testing', 'test', 'abc678def', 'abc4def', 99999, '456test', '4test']
                }
            },
            {
                args: ['{"n":"~arr","v":["testing","test","456test","4test",99999,"abc678def","abc4def"]}', 'ajsiid'],
                expected: undefined,
                details: {
                    dbName: '~arr',
                    set: ['testing', 'test', 'abc678def', 'abc4def', 99999, '456test', '4test']
                }
            },
            {
                args: ['~arr'],
                expected: undefined,
                details: {
                    dbName: '~arr',
                    get: ['testing', 'test', '456test', '4test', 99999, 'abc678def', 'abc4def'],
                    set: ['4test', '456test', 99999, 'abc4def', 'abc678def', 'test', 'testing']
                }
            },
            {
                args: ['~arr', 'false'],
                expected: undefined,
                details: {
                    dbName: '~arr',
                    get: ['testing', 'test', '456test', '4test', 99999, 'abc678def', 'abc4def'],
                    set: ['4test', '456test', 99999, 'abc4def', 'abc678def', 'test', 'testing']
                }
            },
            {
                args: ['~arr', 'true'],
                expected: undefined,
                details: {
                    dbName: '~arr',
                    get: ['testing', 'test', '456test', '4test', 99999, 'abc678def', 'abc4def'],
                    set: ['testing', 'test', 'abc678def', 'abc4def', 99999, '456test', '4test']
                }
            },
            {
                args: ['~arr', 'aiouhsdiaod'],
                expected: undefined,
                details: {
                    dbName: '~arr',
                    get: ['testing', 'test', '456test', '4test', 99999, 'abc678def', 'abc4def'],
                    set: ['testing', 'test', 'abc678def', 'abc4def', 99999, '456test', '4test']
                }
            }
        ], {
            dbMock: VariableCache
        }, {
            arrange(ctx, details) {
                if (details.dbName !== undefined) {
                    when(ctx.contextMock.variables)
                        .thenReturn(instance(ctx.dbMock));
                    when(ctx.dbMock.set(details.dbName, deepEqual(details.set)))
                        .thenResolve();

                    if (details.get !== undefined) {
                        when(ctx.dbMock.get(details.dbName))
                            .thenResolve([...details.get]);
                    }
                }
            },
            assert(ctx, details) {
                if (details.dbName !== undefined) {
                    verify(ctx.dbMock.set(details.dbName, deepEqual(details.set))).once();
                    if (details.get !== undefined)
                        verify(ctx.dbMock.get(details.dbName)).once();
                }
            }
        });
        testExecuteTooManyArgs(subtag, [
            { args: ['[1,2,3]', 'aaa', 'test'], expectedCount: 2 }
        ]);
    });
});
