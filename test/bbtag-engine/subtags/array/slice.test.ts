import type { VariableStore } from '@blargbot/bbtag-engine';
import { NotAnArrayError, NotANumberError, replacers } from '@blargbot/bbtag-engine';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    replacer: replacers.sliceReplacer,
    argCountBounds: { min: 2, max: 3 },
    cases: [
        {
            code: '{slice;abc;0}',
            expected: '`Not an array`',
            errors: [
                { start: 0, end: 13, error: new NotAnArrayError('abc') }
            ],
            setup(ctx) {
                const variables = ctx.createMock<VariableStore>();
                ctx.locals.setup(m => m.variables).returns(variables.instance);
                variables.setup(m => m.get('abc')).returns({ key: '$abc', value: undefined }).mustHappen();
            }
        },
        {
            code: '{slice;[1,2,3,4];0}',
            expected: '[1,2,3,4]'
        },
        {
            code: '{slice;[1,2,3,4];2;-1}',
            expected: '[3]'
        },
        {
            code: '{slice;[1,2,3,4];1}',
            expected: '[2,3,4]'
        },
        {
            code: '{slice;[1,2,3,4];1;3}',
            expected: '[2,3]'
        },
        {
            code: '{slice;[1,2,3,4];abc;3}',
            expected: '`Not a number`',
            errors: [
                { start: 0, end: 23, error: new NotANumberError('abc') }
            ]
        },
        {
            code: '{slice;[1,2,3,4];1;def}',
            expected: '`Not a number`',
            errors: [
                { start: 0, end: 23, error: new NotANumberError('def') }
            ]
        },
        {
            code: '{slice;arr1;1}',
            expected: '[2,3,4]',
            setup(ctx) {
                const variables = ctx.createMock<VariableStore>();
                ctx.locals.setup(m => m.variables).returns(variables.instance);
                variables.setup(m => m.get('arr1')).returns({ key: '$arr1', value: [1, 2, 3, 4] }).mustHappen();
            }
        },
        {
            code: '{slice;arr1;1;3}',
            expected: '[2,3]',
            setup(ctx) {
                const variables = ctx.createMock<VariableStore>();
                ctx.locals.setup(m => m.variables).returns(variables.instance);
                variables.setup(m => m.get('arr1')).returns({ key: '$arr1', value: [1, 2, 3, 4] }).mustHappen();
            }
        }
    ]
});
