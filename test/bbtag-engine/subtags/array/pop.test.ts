import type { VariableStore } from '@blargbot/bbtag-engine';
import { NotAnArrayError, replacers } from '@blargbot/bbtag-engine';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    replacer: replacers.popReplacer,
    argCountBounds: { min: 1, max: 1 },
    cases: [
        {
            code: '{pop;abc}',
            expected: '`Not an array`',
            errors: [
                { start: 0, end: 9, error: new NotAnArrayError('abc') }
            ],
            setup(ctx) {
                const variables = ctx.createMock<VariableStore>();
                ctx.locals.setup(m => m.variables).returns(variables.instance);
                variables.setup(m => m.get('abc')).returns({ key: '$abc', value: undefined }).mustHappen();
            }
        },
        {
            code: '{pop;var1}',
            expected: '`Not an array`',
            errors: [
                { start: 0, end: 10, error: new NotAnArrayError('var1') }
            ],
            setup(ctx) {
                const variables = ctx.createMock<VariableStore>();
                ctx.locals.setup(m => m.variables).returns(variables.instance);
                variables.setup(m => m.get('var1')).returns({ key: '$var1', value: 'This is var 1' }).mustHappen();
            }
        },
        {
            code: '{pop;[1,2,3]}',
            expected: '3'
        },
        {
            code: '{pop;{get;arr1}}',
            expected: 'arr1',
            replacers: [replacers.getReplacer],
            setup(ctx) {
                const variables = ctx.createMock<VariableStore>();
                ctx.locals.setup(m => m.variables).returns(variables.instance);
                variables.setup(m => m.get('arr1')).returns({ key: '$abc', value: ['This', 'is', 'arr1'] }).mustHappen();
                variables.setup((m, $) => m.set('$abc', $(['This', 'is']))).returns().mustHappen();
            }
        },
        {
            code: '{pop;arr1}',
            expected: 'arr1',
            setup(ctx) {
                const variables = ctx.createMock<VariableStore>();
                ctx.locals.setup(m => m.variables).returns(variables.instance);
                variables.setup(m => m.get('arr1')).returns({ key: '$abc', value: ['This', 'is', 'arr1'] }).mustHappen();
                variables.setup((m, $) => m.set('$abc', $(['This', 'is']))).returns().mustHappen();
            }
        },
        {
            code: '{pop;!arr1}',
            expected: 'arr1',
            setup(ctx) {
                const variables = ctx.createMock<VariableStore>();
                ctx.locals.setup(m => m.variables).returns(variables.instance);
                variables.setup(m => m.get('!arr1')).returns({ key: '$abc', value: ['This', 'is', 'arr1'] }).mustHappen();
                variables.setup((m, $) => m.set('$abc', $(['This', 'is']))).returns().mustHappen();
            }
        },
        {
            code: '{pop;[]}',
            expected: ''
        }
    ]
});
