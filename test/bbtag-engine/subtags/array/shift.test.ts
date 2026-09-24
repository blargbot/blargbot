import type { VariableStore } from '@blargbot/bbtag-engine';
import { NotAnArrayError, replacers } from '@blargbot/bbtag-engine';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    replacer: replacers.shiftReplacer,
    argCountBounds: { min: 1, max: 1 },
    cases: [
        {
            code: '{shift;abc}',
            expected: '`Not an array`',
            errors: [
                { start: 0, end: 11, error: new NotAnArrayError('abc') }
            ],
            setup(ctx) {
                const variables = ctx.createMock<VariableStore>();
                ctx.locals.setup(m => m.variables).returns(variables.instance);
                variables.setup(m => m.get('abc')).returns({ key: '$abc', value: undefined }).mustHappen();
            }
        },
        {
            code: '{shift;var1}',
            expected: '`Not an array`',
            errors: [
                { start: 0, end: 12, error: new NotAnArrayError('var1') }
            ],
            setup(ctx) {
                const variables = ctx.createMock<VariableStore>();
                ctx.locals.setup(m => m.variables).returns(variables.instance);
                variables.setup(m => m.get('var1')).returns({ key: '$var1', value: 'This is var 1' }).mustHappen();
            }
        },
        {
            code: '{shift;[1,2,3]}',
            expected: '1'
        },
        {
            code: '{shift;{get;arr1}}',
            expected: 'This',
            replacers: [replacers.getReplacer],
            setup(ctx) {
                const variables = ctx.createMock<VariableStore>();
                ctx.locals.setup(m => m.variables).returns(variables.instance);
                variables.setup(m => m.get('arr1')).returns({ key: '$abc', value: ['This', 'is', 'arr1'] }).mustHappen();
                variables.setup((m, $) => m.set('$abc', $(['is', 'arr1']))).returns().mustHappen();
            }
        },
        {
            code: '{shift;arr1}',
            expected: 'This',
            setup(ctx) {
                const variables = ctx.createMock<VariableStore>();
                ctx.locals.setup(m => m.variables).returns(variables.instance);
                variables.setup(m => m.get('arr1')).returns({ key: '$abc', value: ['This', 'is', 'arr1'] }).mustHappen();
                variables.setup((m, $) => m.set('$abc', $(['is', 'arr1']))).returns().mustHappen();
            }
        },
        {
            code: '{shift;!arr1}',
            expected: 'This',
            setup(ctx) {
                const variables = ctx.createMock<VariableStore>();
                ctx.locals.setup(m => m.variables).returns(variables.instance);
                variables.setup(m => m.get('!arr1')).returns({ key: '$abc', value: ['This', 'is', 'arr1'] }).mustHappen();
                variables.setup((m, $) => m.set('$abc', $(['is', 'arr1']))).returns().mustHappen();
            }
        },
        {
            code: '{shift;[]}',
            expected: ''
        }
    ]
});
