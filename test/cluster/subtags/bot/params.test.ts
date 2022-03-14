import { BBTagRuntimeError, NotANumberError, NotEnoughArgumentsError } from '@blargbot/cluster/bbtag/errors';
import { ParamsSubtag } from '@blargbot/cluster/subtags/bot/params';

import { runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new ParamsSubtag(),
    argCountBounds: { min: 0, max: 2 },
    setup(ctx) {
        ctx.rootScope.paramsarray = ['arg1', 'arg2', 'arg3 arg3', 'arg4', 'arg5'];
    },
    cases: [
        {
            code: '{params}',
            expected: 'arg1 arg2 arg3 arg3 arg4 arg5'
        },
        {
            code: '{params}',
            expected: '',
            setup(ctx) {
                ctx.rootScope.paramsarray = [];
            }
        },
        {
            code: '{params;0}',
            expected: 'arg1'
        },
        {
            code: '{params;2}',
            expected: 'arg3 arg3'
        },
        {
            code: '{params;7}',
            expected: '`Not enough arguments`',
            errors: [
                { start: 0, end: 10, error: new NotEnoughArgumentsError(7, 5) }
            ]
        },
        {
            code: '{params;-1}',
            expected: '`Not enough arguments`',
            errors: [
                { start: 0, end: 11, error: new NotEnoughArgumentsError(-1, 5) }
            ]
        },
        {
            code: '{params;abc}',
            expected: '`Not a number`',
            errors: [
                { start: 0, end: 12, error: new NotANumberError('abc') }
            ]
        },
        {
            code: '{params;0;2}',
            expected: 'arg1 arg2'
        },
        {
            code: '{params;2;3}',
            expected: 'arg3 arg3'
        },
        {
            code: '{params;2;n}',
            expected: 'arg3 arg3 arg4 arg5'
        },
        {
            code: '{params;2;0}',
            expected: 'arg1 arg2'
        },
        {
            code: '{params;3;n}',
            expected: 'arg4 arg5'
        },
        {
            code: '{params;0;n}',
            expected: 'arg1 arg2 arg3 arg3 arg4 arg5'
        },
        {
            code: '{params;0;7}',
            expected: 'arg1 arg2 arg3 arg3 arg4 arg5'
        },
        {
            code: '{params;7;0}',
            expected: 'arg1 arg2 arg3 arg3 arg4 arg5'
        },
        {
            code: '{params;6;7}',
            expected: '`Not enough arguments`',
            errors: [
                { start: 0, end: 12, error: new NotEnoughArgumentsError(6, 5) }
            ]
        },
        {
            code: '{params;7;6}',
            expected: '`Not enough arguments`',
            errors: [
                { start: 0, end: 12, error: new NotEnoughArgumentsError(6, 5) }
            ]
        },
        {
            code: '{params;-1;2}',
            expected: '`Not enough arguments`',
            errors: [
                { start: 0, end: 13, error: new NotEnoughArgumentsError(-1, 5) }
            ]
        },
        {
            code: '{params;2;-1}',
            expected: '`Not enough arguments`',
            errors: [
                { start: 0, end: 13, error: new NotEnoughArgumentsError(-1, 5) }
            ]
        },
        {
            code: '{params;abc;4}',
            expected: '`Not a number`',
            errors: [
                { start: 0, end: 14, error: new NotANumberError('abc') }
            ]
        },
        {
            code: '{params;2;def}',
            expected: '`Not a number`',
            errors: [
                { start: 0, end: 14, error: new NotANumberError('def') }
            ]
        },
        {
            code: '{params}',
            expected: '`{params} can only be used inside {function}`',
            errors: [
                { start: 0, end: 8, error: new BBTagRuntimeError('{params} can only be used inside {function}') }
            ],
            setup(ctx) {
                ctx.rootScope.paramsarray = undefined;
            }
        },
        {
            code: '{params;1}',
            expected: '`{params} can only be used inside {function}`',
            errors: [
                { start: 0, end: 10, error: new BBTagRuntimeError('{params} can only be used inside {function}') }
            ],
            setup(ctx) {
                ctx.rootScope.paramsarray = undefined;
            }
        },
        {
            code: '{params;1;2}',
            expected: '`{params} can only be used inside {function}`',
            errors: [
                { start: 0, end: 12, error: new BBTagRuntimeError('{params} can only be used inside {function}') }
            ],
            setup(ctx) {
                ctx.rootScope.paramsarray = undefined;
            }
        }
    ]
});
