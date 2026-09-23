import type { VariableStore } from '@blargbot/bbtag-engine';
import { NotAnArrayError, replacers } from '@blargbot/bbtag-engine';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    replacer: replacers.unshiftReplacer,
    argCountBounds: { min: 2, max: Infinity },
    cases: [
        {
            code: '{unshift;abc;def}',
            expected: '`Not an array`',
            errors: [
                { start: 0, end: 17, error: new NotAnArrayError('abc') }
            ],
            setup(ctx) {
                const variables = ctx.createMock<VariableStore>();
                ctx.locals.setup(m => m.variables).returns(variables.instance);
                variables.setup(m => m.get('abc')).returns({ key: '$abc', value: undefined }).mustHappen();
            }
        },
        {
            code: '{unshift;var1;def}',
            expected: '`Not an array`',
            errors: [
                { start: 0, end: 18, error: new NotAnArrayError('var1') }
            ],
            setup(ctx) {
                const variables = ctx.createMock<VariableStore>();
                ctx.locals.setup(m => m.variables).returns(variables.instance);
                variables.setup(m => m.get('var1')).returns({ key: '$var1', value: 'This is var 1' }).mustHappen();
            }
        },
        {
            code: '{unshift;[1,2,3];def}',
            expected: '["def",1,2,3]'
        },
        {
            code: '{unshift;{get;arr1};def}',
            expected: '',
            replacers: [replacers.getReplacer],
            setup(ctx) {
                const variables = ctx.createMock<VariableStore>();
                ctx.locals.setup(m => m.variables).returns(variables.instance);
                variables.setup(m => m.get('arr1')).returns({ key: '$abc', value: ['This', 'is', 'arr1'] }).mustHappen();
                variables.setup((m, $) => m.set('$abc', $.looksLike(['def', 'This', 'is', 'arr1']))).returns().mustHappen();
            }
        },
        {
            code: '{unshift;arr1;def}',
            expected: '',
            setup(ctx) {
                const variables = ctx.createMock<VariableStore>();
                ctx.locals.setup(m => m.variables).returns(variables.instance);
                variables.setup(m => m.get('arr1')).returns({ key: '$abc', value: ['This', 'is', 'arr1'] }).mustHappen();
                variables.setup((m, $) => m.set('$abc', $.looksLike(['def', 'This', 'is', 'arr1']))).returns().mustHappen();
            }
        },
        {
            code: '{unshift;!arr1;def}',
            expected: '',
            setup(ctx) {
                const variables = ctx.createMock<VariableStore>();
                ctx.locals.setup(m => m.variables).returns(variables.instance);
                variables.setup(m => m.get('!arr1')).returns({ key: '$abc', value: ['This', 'is', 'arr1'] }).mustHappen();
                variables.setup((m, $) => m.set('$abc', $.looksLike(['def', 'This', 'is', 'arr1']))).returns().mustHappen();
            }
        },
        {
            code: '{unshift;[1];def;ghi;123}',
            expected: '["def","ghi","123",1]'
        }
    ]
});
