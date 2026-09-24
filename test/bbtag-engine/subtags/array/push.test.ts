import type { VariableStore } from '@blargbot/bbtag-engine';
import { NotAnArrayError, replacers } from '@blargbot/bbtag-engine';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    replacer: replacers.pushReplacer,
    argCountBounds: { min: 2, max: Infinity },
    cases: [
        {
            code: '{push;abc;def}',
            expected: '`Not an array`',
            errors: [
                { start: 0, end: 14, error: new NotAnArrayError('abc') }
            ],
            setup(ctx) {
                const variables = ctx.createMock<VariableStore>();
                ctx.locals.setup(m => m.variables).returns(variables.instance);
                variables.setup(m => m.get('abc')).returns({ key: '$abc', value: undefined }).mustHappen();
            }
        },
        {
            code: '{push;var1;def}',
            expected: '`Not an array`',
            errors: [
                { start: 0, end: 15, error: new NotAnArrayError('var1') }
            ],
            setup(ctx) {
                const variables = ctx.createMock<VariableStore>();
                ctx.locals.setup(m => m.variables).returns(variables.instance);
                variables.setup(m => m.get('var1')).returns({ key: '$var1', value: 'This is var 1' }).mustHappen();
            }
        },
        {
            code: '{push;[1,2,3];def}',
            expected: '[1,2,3,"def"]'
        },
        {
            code: '{push;{get;arr1};def}',
            expected: '',
            replacers: [replacers.getReplacer],
            setup(ctx) {
                const variables = ctx.createMock<VariableStore>();
                ctx.locals.setup(m => m.variables).returns(variables.instance);
                variables.setup(m => m.get('arr1')).returns({ key: '$abc', value: ['This', 'is', 'arr1'] }).mustHappen();
                variables.setup((m, $) => m.set('$abc', $(['This', 'is', 'arr1', 'def']))).returns().mustHappen();
            }
        },
        {
            code: '{push;arr1;def}',
            expected: '',
            setup(ctx) {
                const variables = ctx.createMock<VariableStore>();
                ctx.locals.setup(m => m.variables).returns(variables.instance);
                variables.setup(m => m.get('arr1')).returns({ key: '$abc', value: ['This', 'is', 'arr1'] }).mustHappen();
                variables.setup((m, $) => m.set('$abc', $(['This', 'is', 'arr1', 'def']))).returns().mustHappen();
            }
        },
        {
            code: '{push;!arr1;def}',
            expected: '',
            setup(ctx) {
                const variables = ctx.createMock<VariableStore>();
                ctx.locals.setup(m => m.variables).returns(variables.instance);
                variables.setup(m => m.get('!arr1')).returns({ key: '$abc', value: ['This', 'is', 'arr1'] }).mustHappen();
                variables.setup((m, $) => m.set('$abc', $(['This', 'is', 'arr1', 'def']))).returns().mustHappen();
            }
        },
        {
            code: '{push;[1];def;ghi;123}',
            expected: '[1,"def","ghi","123"]'
        }
    ]
});
