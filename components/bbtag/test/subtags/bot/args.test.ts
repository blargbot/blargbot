import { NotANumberError, NotEnoughArgumentsError, Subtag } from '@bbtag/blargbot';
import { ArgsSubtag } from '@bbtag/blargbot/subtags';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(ArgsSubtag),
    argCountBounds: { min: 0, max: 2 },
    setupEach(ctx) {
        ctx.options.inputRaw = 'arg1 arg2 "arg3 arg3" arg4 "arg5"';
    },
    cases: [
        {
            code: '{args}',
            expected: 'arg1 arg2 arg3 arg3 arg4 arg5'
        },
        {
            code: '{args}',
            expected: '',
            setup(ctx) {
                ctx.options.inputRaw = '';
            }
        },
        {
            code: '{args}',
            expected: '{json;{\n "key": "value"\n}}',
            setup(ctx) {
                ctx.options.inputRaw = '{json;{\n  "key": "value"\n}}';
            }
        },
        {
            code: '{args;0}',
            expected: 'arg1'
        },
        {
            code: '{args;2}',
            expected: 'arg3 arg3'
        },
        {
            code: '{args;7}',
            expected: '`Not enough arguments`',
            errors: [
                { start: 0, end: 8, error: new NotEnoughArgumentsError(8, 5) }
            ]
        },
        {
            code: '{args;-1}',
            expected: '`Not enough arguments`',
            errors: [
                { start: 0, end: 9, error: new NotEnoughArgumentsError(0, 5) }
            ]
        },
        {
            code: '{args;abc}',
            expected: '`Not a number`',
            errors: [
                { start: 0, end: 10, error: new NotANumberError('abc') }
            ]
        },
        {
            code: '{args;0;2}',
            expected: 'arg1 arg2'
        },
        {
            code: '{args;2;3}',
            expected: 'arg3 arg3'
        },
        {
            code: '{args;2;n}',
            expected: 'arg3 arg3 arg4 arg5'
        },
        {
            code: '{args;2;0}',
            expected: 'arg1 arg2'
        },
        {
            code: '{args;3;n}',
            expected: 'arg4 arg5'
        },
        {
            code: '{args;0;n}',
            expected: 'arg1 arg2 arg3 arg3 arg4 arg5'
        },
        {
            code: '{args;0;7}',
            expected: 'arg1 arg2 arg3 arg3 arg4 arg5'
        },
        {
            code: '{args;7;0}',
            expected: 'arg1 arg2 arg3 arg3 arg4 arg5'
        },
        {
            code: '{args;6;7}',
            expected: '`Not enough arguments`',
            errors: [
                { start: 0, end: 10, error: new NotEnoughArgumentsError(7, 5) }
            ]
        },
        {
            code: '{args;7;6}',
            expected: '`Not enough arguments`',
            errors: [
                { start: 0, end: 10, error: new NotEnoughArgumentsError(7, 5) }
            ]
        },
        {
            code: '{args;-1;2}',
            expected: '`Not enough arguments`',
            errors: [
                { start: 0, end: 11, error: new NotEnoughArgumentsError(0, 5) }
            ]
        },
        {
            code: '{args;2;-1}',
            expected: '`Not enough arguments`',
            errors: [
                { start: 0, end: 11, error: new NotEnoughArgumentsError(0, 5) }
            ]
        },
        {
            code: '{args;abc;4}',
            expected: '`Not a number`',
            errors: [
                { start: 0, end: 12, error: new NotANumberError('abc') }
            ]
        },
        {
            code: '{args;2;def}',
            expected: '`Not a number`',
            errors: [
                { start: 0, end: 12, error: new NotANumberError('def') }
            ]
        }
    ]
});
