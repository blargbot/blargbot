import type { VariableStore } from '@blargbot/bbtag-engine';
import { NotAnArrayError, NotANumberError, replacers } from '@blargbot/bbtag-engine';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    replacer: replacers.spliceReplacer,
    argCountBounds: { min: 2, max: Infinity },
    cases: [
        {
            code: '{splice;arr1;0}',
            expected: '[]',
            setup(ctx) {
                const variables = ctx.createMock<VariableStore>();
                ctx.locals.setup(m => m.variables).returns(variables.instance);
                variables.setup(m => m.get('arr1')).returns({ key: '$arr1', value: [1, 2, 3, 4, 5, 6] }).mustHappen(1);
                variables.setup((m, $) => m.set('$arr1', $([1, 2, 3, 4, 5, 6]))).returns().mustHappen(1);
            }
        },
        {
            code: '{splice;arr1;1}',
            expected: '[]',
            setup(ctx) {
                const variables = ctx.createMock<VariableStore>();
                ctx.locals.setup(m => m.variables).returns(variables.instance);
                variables.setup(m => m.get('arr1')).returns({ key: '$arr1', value: [1, 2, 3, 4, 5, 6] }).mustHappen(1);
                variables.setup((m, $) => m.set('$arr1', $([1, 2, 3, 4, 5, 6]))).returns().mustHappen(1);
            }
        },
        {
            code: '{splice;arr1;2;1}',
            expected: '[3]',
            setup(ctx) {
                const variables = ctx.createMock<VariableStore>();
                ctx.locals.setup(m => m.variables).returns(variables.instance);
                variables.setup(m => m.get('arr1')).returns({ key: '$arr1', value: [1, 2, 3, 4, 5, 6] }).mustHappen(1);
                variables.setup((m, $) => m.set('$arr1', $([1, 2, 4, 5, 6]))).returns().mustHappen(1);
            }
        },
        {
            code: '{splice;arr1;1;3}',
            expected: '[2,3,4]',
            setup(ctx) {
                const variables = ctx.createMock<VariableStore>();
                ctx.locals.setup(m => m.variables).returns(variables.instance);
                variables.setup(m => m.get('arr1')).returns({ key: '$arr1', value: [1, 2, 3, 4, 5, 6] }).mustHappen(1);
                variables.setup((m, $) => m.set('$arr1', $([1, 5, 6]))).returns().mustHappen(1);
            }
        },
        {
            code: '{splice;arr1;4;3}',
            expected: '[5,6]',
            setup(ctx) {
                const variables = ctx.createMock<VariableStore>();
                ctx.locals.setup(m => m.variables).returns(variables.instance);
                variables.setup(m => m.get('arr1')).returns({ key: '$arr1', value: [1, 2, 3, 4, 5, 6] }).mustHappen(1);
                variables.setup((m, $) => m.set('$arr1', $([1, 2, 3, 4]))).returns().mustHappen(1);
            }
        },
        {
            code: '{splice;arr1;2;0;a}',
            expected: '[]',
            setup(ctx) {
                const variables = ctx.createMock<VariableStore>();
                ctx.locals.setup(m => m.variables).returns(variables.instance);
                variables.setup(m => m.get('arr1')).returns({ key: '$arr1', value: [1, 2, 3, 4, 5, 6] }).mustHappen(1);
                variables.setup((m, $) => m.set('$arr1', $([1, 2, 'a', 3, 4, 5, 6]))).returns().mustHappen(1);
            }
        },
        {
            code: '{splice;arr1;2;1;a}',
            expected: '[3]',
            setup(ctx) {
                const variables = ctx.createMock<VariableStore>();
                ctx.locals.setup(m => m.variables).returns(variables.instance);
                variables.setup(m => m.get('arr1')).returns({ key: '$arr1', value: [1, 2, 3, 4, 5, 6] }).mustHappen(1);
                variables.setup((m, $) => m.set('$arr1', $([1, 2, 'a', 4, 5, 6]))).returns().mustHappen(1);
            }
        },
        {
            code: '{splice;arr1;2;2;a;b;c;d;e;f}',
            expected: '[3,4]',
            setup(ctx) {
                const variables = ctx.createMock<VariableStore>();
                ctx.locals.setup(m => m.variables).returns(variables.instance);
                variables.setup(m => m.get('arr1')).returns({ key: '$arr1', value: [1, 2, 3, 4, 5, 6] }).mustHappen(1);
                variables.setup((m, $) => m.set('$arr1', $([1, 2, 'a', 'b', 'c', 'd', 'e', 'f', 5, 6]))).returns().mustHappen(1);
            }
        },
        {
            code: '{splice;arr1;2;2;a;1;2;d;e;f}',
            expected: '[3,4]',
            setup(ctx) {
                const variables = ctx.createMock<VariableStore>();
                ctx.locals.setup(m => m.variables).returns(variables.instance);
                variables.setup(m => m.get('arr1')).returns({ key: '$arr1', value: [1, 2, 3, 4, 5, 6] }).mustHappen(1);
                variables.setup((m, $) => m.set('$arr1', $([1, 2, 'a', '1', '2', 'd', 'e', 'f', 5, 6]))).returns().mustHappen(1);
            }
        },
        {
            code: '{splice;arr1;2;2;a;[1,2,"d"];e;f}',
            expected: '[3,4]',
            setup(ctx) {
                const variables = ctx.createMock<VariableStore>();
                ctx.locals.setup(m => m.variables).returns(variables.instance);
                variables.setup(m => m.get('arr1')).returns({ key: '$arr1', value: [1, 2, 3, 4, 5, 6] }).mustHappen(1);
                variables.setup((m, $) => m.set('$arr1', $([1, 2, 'a', 1, 2, 'd', 'e', 'f', 5, 6]))).returns().mustHappen(1);
            }
        },
        {
            code: '{splice;arr1;2;2;a;[[1,2,"d"]];e;f}',
            expected: '[3,4]',
            setup(ctx) {
                const variables = ctx.createMock<VariableStore>();
                ctx.locals.setup(m => m.variables).returns(variables.instance);
                variables.setup(m => m.get('arr1')).returns({ key: '$arr1', value: [1, 2, 3, 4, 5, 6] }).mustHappen(1);
                variables.setup((m, $) => m.set('$arr1', $([1, 2, 'a', [1, 2, 'd'], 'e', 'f', 5, 6]))).returns().mustHappen(1);
            }
        },
        {
            code: '{splice;{get;arr1};2;2;a;[[1,2,"d"]];e;f}',
            expected: '[3,4]',
            replacers: [replacers.getReplacer],
            setup(ctx) {
                const variables = ctx.createMock<VariableStore>();
                ctx.locals.setup(m => m.variables).returns(variables.instance);
                variables.setup(m => m.get('arr1')).returns({ key: '$arr1', value: [1, 2, 3, 4, 5, 6] }).mustHappen(1);
                variables.setup((m, $) => m.set('$arr1', $([1, 2, 'a', [1, 2, 'd'], 'e', 'f', 5, 6]))).returns().mustHappen(1);
            }
        },
        {
            code: '{splice;[1,2,3,4,5,6];2;2;a;[[1,2,"d"]];e;f}',
            expected: '[3,4]'
        },
        {
            code: '{splice;var1;2;2;a;[[1,2,"d"]];e;f}',
            expected: '`Not an array`',
            errors: [
                { start: 0, end: 35, error: new NotAnArrayError('var1') }
            ],
            setup(ctx) {
                const variables = ctx.createMock<VariableStore>();
                ctx.locals.setup(m => m.variables).returns(variables.instance);
                variables.setup(m => m.get('var1')).returns({ key: '$var1', value: undefined }).mustHappen(1);
            }
        },
        {
            code: '{splice;[1,2,3,4,5,6];abc;2;a;[[1,2,"d"]];e;f}',
            expected: '`Not a number`',
            errors: [
                { start: 0, end: 46, error: new NotANumberError('abc') }
            ]
        },
        {
            code: '{splice;[1,2,3,4,5,6];2;def;a;[[1,2,"d"]];e;f}',
            expected: '`Not a number`',
            errors: [
                { start: 0, end: 46, error: new NotANumberError('def') }
            ]
        }
    ]
});
