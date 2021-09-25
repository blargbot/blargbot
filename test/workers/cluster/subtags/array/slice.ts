import { VariableCache } from '@cluster/bbtag';
import { SliceSubtag } from '@cluster/subtags/array/slice';
import { BBTagRuntimeScope } from '@cluster/types';
import { describe } from 'mocha';
import { anyString, instance, verify, when } from 'ts-mockito';

import { testExecute, testExecuteFail, testExecuteNotEnoughArgs, testExecuteTooManyArgs } from '../baseSubtagTests';

describe('{slice}', () => {
    const subtag = new SliceSubtag();
    describe('#execute', () => {
        testExecuteNotEnoughArgs(subtag, [
            { args: [], expectedCount: 2 },
            { args: ['[1,2,3]'], expectedCount: 2 }
        ]);
        testExecuteFail(subtag, [
            { args: ['123', '0'], error: 'Not an array' },
            { args: ['[123', '0'], error: 'Not an array' }
        ]);
        testExecute(subtag, [
            {
                args: ['[]', '0'],
                expected: '[]',
                details: {}
            },
            {
                args: ['[]', '0', '0'],
                expected: '[]',
                details: {}
            },
            {
                args: ['[]', '0', '0'],
                expected: '[]',
                details: {}
            },
            {
                args: ['[1,2,3,4,5,6,7,8,9]', '0'],
                expected: '[1,2,3,4,5,6,7,8,9]',
                details: {}
            },
            {
                args: ['[1,2,3,4,5,6,7,8,9]', '5'],
                expected: '[6,7,8,9]',
                details: {}
            },
            {
                args: ['[1,2,3,4,5,6,7,8,9]', '-2'],
                expected: '[8,9]',
                details: {}
            },
            {
                args: ['[1,2,3,4,5,6,7,8,9]', '9'],
                expected: '[]',
                details: {}
            },
            {
                args: ['[1,2,3,4,5,6,7,8,9]', '0', '9'],
                expected: '[1,2,3,4,5,6,7,8,9]',
                details: {}
            },
            {
                args: ['[1,2,3,4,5,6,7,8,9]', '2', '7'],
                expected: '[3,4,5,6,7]',
                details: {}
            },
            {
                args: ['[1,2,3,4,5,6,7,8,9]', '4', '-2'],
                expected: '[5,6,7]',
                details: {}
            },
            {
                args: ['[1,2,3,4,5,6,7,8,9]', '-2', '4'],
                expected: '[]',
                details: {}
            },
            {
                args: ['[1,2,3,4,5,6,7,8,9]', '5', '5'],
                expected: '[]',
                details: {}
            },
            {
                args: ['[1,2,3,4,5,6,7,8,9]', 'aaaaa'],
                expected: '[6,7,8,9]',
                details: { fallback: '5' }
            },
            {
                args: ['[1,2,3,4,5,6,7,8,9]', 'aaaaa', '7'],
                expected: '[6,7]',
                details: { fallback: '5' }
            },
            {
                args: ['[1,2,3,4,5,6,7,8,9]', '2', 'bbbb'],
                expected: '[3,4,5]',
                details: { fallback: '5' }
            },
            {
                args: ['{"n":"~var","v":[]}', '0'],
                expected: '[]',
                details: {}
            },
            {
                args: ['{"n":"~var","v":[]}', '0', '0'],
                expected: '[]',
                details: {}
            },
            {
                args: ['{"n":"~var","v":[1,2,3,4,5,6,7,8,9]}', '0'],
                expected: '[1,2,3,4,5,6,7,8,9]',
                details: {}
            },
            {
                args: ['{"n":"~var","v":[1,2,3,4,5,6,7,8,9]}', '5'],
                expected: '[6,7,8,9]',
                details: {}
            },
            {
                args: ['{"n":"~var","v":[1,2,3,4,5,6,7,8,9]}', '-2'],
                expected: '[8,9]',
                details: {}
            },
            {
                args: ['{"n":"~var","v":[1,2,3,4,5,6,7,8,9]}', '9'],
                expected: '[]',
                details: {}
            },
            {
                args: ['{"n":"~var","v":[1,2,3,4,5,6,7,8,9]}', '0', '9'],
                expected: '[1,2,3,4,5,6,7,8,9]',
                details: {}
            },
            {
                args: ['{"n":"~var","v":[1,2,3,4,5,6,7,8,9]}', '2', '7'],
                expected: '[3,4,5,6,7]',
                details: {}
            },
            {
                args: ['{"n":"~var","v":[1,2,3,4,5,6,7,8,9]}', '4', '-2'],
                expected: '[5,6,7]',
                details: {}
            },
            {
                args: ['{"n":"~var","v":[1,2,3,4,5,6,7,8,9]}', '-2', '4'],
                expected: '[]',
                details: {}
            },
            {
                args: ['{"n":"~var","v":[1,2,3,4,5,6,7,8,9]}', '5', '5'],
                expected: '[]',
                details: {}
            },
            {
                args: ['~var', '0'],
                expected: '[]',
                details: { dbName: '~var', get: [] }
            },
            {
                args: ['~var', '0', '0'],
                expected: '[]',
                details: { dbName: '~var', get: [] }
            },
            {
                args: ['~var', '0'],
                expected: '[1,2,3,4,5,6,7,8,9]',
                details: { dbName: '~var', get: [1, 2, 3, 4, 5, 6, 7, 8, 9] }
            },
            {
                args: ['~var', '5'],
                expected: '[6,7,8,9]',
                details: { dbName: '~var', get: [1, 2, 3, 4, 5, 6, 7, 8, 9] }
            },
            {
                args: ['~var', '-2'],
                expected: '[8,9]',
                details: { dbName: '~var', get: [1, 2, 3, 4, 5, 6, 7, 8, 9] }
            },
            {
                args: ['~var', '9'],
                expected: '[]',
                details: { dbName: '~var', get: [1, 2, 3, 4, 5, 6, 7, 8, 9] }
            },
            {
                args: ['~var', '0', '9'],
                expected: '[1,2,3,4,5,6,7,8,9]',
                details: { dbName: '~var', get: [1, 2, 3, 4, 5, 6, 7, 8, 9] }
            },
            {
                args: ['~var', '2', '7'],
                expected: '[3,4,5,6,7]',
                details: { dbName: '~var', get: [1, 2, 3, 4, 5, 6, 7, 8, 9] }
            },
            {
                args: ['~var', '4', '-2'],
                expected: '[5,6,7]',
                details: { dbName: '~var', get: [1, 2, 3, 4, 5, 6, 7, 8, 9] }
            },
            {
                args: ['~var', '-2', '4'],
                expected: '[]',
                details: { dbName: '~var', get: [1, 2, 3, 4, 5, 6, 7, 8, 9] }
            },
            {
                args: ['~var', '5', '5'],
                expected: '[]',
                details: { dbName: '~var', get: [1, 2, 3, 4, 5, 6, 7, 8, 9] }
            }
        ], {
            dbMock: VariableCache,
            scopeMock: undefined as unknown as BBTagRuntimeScope
        }, {
            arrange(ctx, details) {
                if (details.dbName !== undefined) {
                    when(ctx.contextMock.variables)
                        .thenReturn(instance(ctx.dbMock));
                    when(ctx.dbMock.get(details.dbName))
                        .thenResolve([...details.get]);
                }
                if ('fallback' in details) {
                    when(ctx.contextMock.scope)
                        .thenReturn(instance(ctx.scopeMock));
                    when(ctx.scopeMock.fallback)
                        .thenReturn(details.fallback);
                }
            },
            assert(ctx, details) {
                if (details.dbName === undefined)
                    verify(ctx.dbMock.get(anyString())).never();
                else
                    verify(ctx.dbMock.get(details.dbName)).once();

                if ('fallback' in details)
                    verify(ctx.scopeMock.fallback).once();
            }
        });
        testExecuteFail(subtag, [
            {
                args: ['[1,2,3,4,5,6,7,8,9]', 'abc'],
                error: 'Not a number',
                debugMessage: 'abc is not a number',
                details: { fallback: undefined }
            },
            {
                args: ['[1,2,3,4,5,6,7,8,9]', '5', 'xyz'],
                error: 'Not a number',
                debugMessage: 'xyz is not a number',
                details: { fallback: undefined }
            },
            {
                args: ['[1,2,3,4,5,6,7,8,9]', 'abc'],
                error: 'Not a number',
                debugMessage: 'abc is not a number',
                details: { fallback: 'nope' }
            },
            {
                args: ['[1,2,3,4,5,6,7,8,9]', '5', 'xyz'],
                error: 'Not a number',
                debugMessage: 'xyz is not a number',
                details: { fallback: 'qwerty' }
            },
            {
                args: ['[1,2,3,4,5,6,7,8,9]', 'abc', 'def'],
                error: 'Not a number',
                debugMessage: 'abc is not a number',
                details: { fallback: undefined }
            }
        ], {
            scopeMock: undefined as unknown as BBTagRuntimeScope
        }, {
            arrange(ctx, details) {
                when(ctx.contextMock.scope)
                    .thenReturn(instance(ctx.scopeMock));
                when(ctx.scopeMock.fallback)
                    .thenReturn(details.fallback);
            }
        });
        testExecuteTooManyArgs(subtag, [
            { args: ['[1,2,3]', '0', '1', '5'], expectedCount: 3 }
        ]);
    });
});
