import type { VariableStore } from '@blargbot/bbtag-engine';
import { NotAnArrayError, replacers } from '@blargbot/bbtag-engine';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    replacer: replacers.joinReplacer,
    argCountBounds: { min: 2, max: 2 },
    cases: [
        {
            code: '{join;a;b}',
            expected: '`Not an array`',
            setup(ctx) {
                const variables = ctx.createMock<VariableStore>();
                ctx.locals.setup(m => m.variables).returns(variables.instance);
                variables.setup(m => m.get('a')).returns({ key: '$arr1', value: undefined }).mustHappen();
            },
            errors: [
                { start: 0, end: 10, error: new NotAnArrayError('a') }
            ]
        },
        { code: '{join;[1,2,3];x}', expected: '1x2x3' },
        { code: '{join;[1];x}', expected: '1' },
        { code: '{join;["a","b","c"];_}', expected: 'a_b_c' },
        {
            code: '{join;arr1;~}',
            expected: 'this~is~arr1',
            setup(ctx) {
                const variables = ctx.createMock<VariableStore>();
                ctx.locals.setup(m => m.variables).returns(variables.instance);
                variables.setup(m => m.get('arr1')).returns({ key: '$arr1', value: ['this', 'is', 'arr1'] }).mustHappen();
            }
        },
        {
            code: '{join;var1;~}',
            expected: '`Not an array`',
            errors: [
                { start: 0, end: 13, error: new NotAnArrayError('var1') }
            ],
            setup(ctx) {
                const variables = ctx.createMock<VariableStore>();
                ctx.locals.setup(m => m.variables).returns(variables.instance);
                variables.setup(m => m.get('var1')).returns({ key: '$var1', value: 'This is var1' }).mustHappen();
            }
        },
        {
            code: '{join;{get;arr1};~}',
            expected: 'this~is~arr1',
            replacers: [replacers.getReplacer],
            setup(ctx) {
                const variables = ctx.createMock<VariableStore>();
                ctx.locals.setup(m => m.variables).returns(variables.instance);
                variables.setup(m => m.get('arr1')).returns({ key: '$arr1', value: ['this', 'is', 'arr1'] }).mustHappen();
            }
        }
    ]
});
