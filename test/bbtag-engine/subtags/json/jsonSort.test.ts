import type { VariablesLocals, VariableStore } from '@blargbot/bbtag-engine';
import { BBTagRuntimeError, NotAnArrayError, replacers } from '@blargbot/bbtag-engine';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests<VariablesLocals>({
    replacer: replacers.jsonSortReplacer,
    argCountBounds: { min: 2, max: 3 },
    cases: [
        {
            code: '{jsonsort;{j;[{"points": 10, "name": "Blargbot"},{"points": 3, "name": "UNO"},{"points": 6, "name": "Stupid cat"},{"points": 12, "name": "Winner"}]};points}',
            expected: '[{"points":3,"name":"UNO"},{"points":6,"name":"Stupid cat"},{"points":10,"name":"Blargbot"},{"points":12,"name":"Winner"}]',
            replacers: [replacers.jsonReplacer]
        },
        {
            code: '{jsonsort;{j;[{"points": 10, "name": "Blargbot"},{"points": 3, "name": "UNO"},{"points": 6, "name": "Stupid cat"},{"points": 12, "name": "Winner"}]};points;a}',
            expected: '[{"points":12,"name":"Winner"},{"points":10,"name":"Blargbot"},{"points":6,"name":"Stupid cat"},{"points":3,"name":"UNO"}]',
            replacers: [replacers.jsonReplacer]
        },
        {
            code: '{jsonsort;arrayVar;points}',
            expected: '',
            setup(ctx) {
                const variables = ctx.createMock<VariableStore>();
                ctx.locals.setup(m => m.variables).returns(variables.instance);
                variables.setup(m => m.get('arrayVar')).returns({
                    key: '~arrayVar', value: [
                        { points: 10, name: 'Blargbot' },
                        { points: 3, name: 'UNO' },
                        { points: 6, name: 'Stupid cat' },
                        { points: 12, name: 'Winner' }
                    ]
                }).mustHappen(1);
                variables.setup((m, $) => m.set('~arrayVar', $([
                    { points: 3, name: 'UNO' },
                    { points: 6, name: 'Stupid cat' },
                    { points: 10, name: 'Blargbot' },
                    { points: 12, name: 'Winner' }
                ]))).returns().mustHappen(1);
            }
        },
        {
            code: '{jsonsort;arrayVar;points;a}',
            expected: '',
            setup(ctx) {
                const variables = ctx.createMock<VariableStore>();
                ctx.locals.setup(m => m.variables).returns(variables.instance);
                variables.setup(m => m.get('arrayVar')).returns({
                    key: '~arrayVar', value: [
                        { points: 10, name: 'Blargbot' },
                        { points: 3, name: 'UNO' },
                        { points: 6, name: 'Stupid cat' },
                        { points: 12, name: 'Winner' }
                    ]
                }).mustHappen(1);
                variables.setup((m, $) => m.set('~arrayVar', $([
                    { points: 12, name: 'Winner' },
                    { points: 10, name: 'Blargbot' },
                    { points: 6, name: 'Stupid cat' },
                    { points: 3, name: 'UNO' }
                ]))).returns().mustHappen(1);
            }
        },
        {
            code: '{jsonsort;arrayVar;points;a}',
            expected: '`Cannot read property points at index 1, 1 total failures`',
            errors: [
                { start: 0, end: 28, error: new BBTagRuntimeError('Cannot read property points at index 1, 1 total failures') }
            ],
            setup(ctx) {
                const variables = ctx.createMock<VariableStore>();
                ctx.locals.setup(m => m.variables).returns(variables.instance);
                variables.setup(m => m.get('arrayVar')).returns({
                    key: '~arrayVar', value: [
                        { points: 10, name: 'Blargbot' },
                        { test: 3, name: 'UNO' },
                        { points: 6, name: 'Stupid cat' },
                        { points: 12, name: 'Winner' }
                    ]
                }).mustHappen(1);
            }
        },
        {
            code: '{jsonsort;arrayVar;abc;a}',
            expected: '`Cannot read property abc at index 0, 4 total failures`',
            errors: [
                { start: 0, end: 25, error: new BBTagRuntimeError('Cannot read property abc at index 0, 4 total failures') }
            ],
            setup(ctx) {
                const variables = ctx.createMock<VariableStore>();
                ctx.locals.setup(m => m.variables).returns(variables.instance);
                variables.setup(m => m.get('arrayVar')).returns({
                    key: '~arrayVar', value: [
                        { points: 10, name: 'Blargbot' },
                        { points: 3, name: 'UNO' },
                        { points: 6, name: 'Stupid cat' },
                        { points: 12, name: 'Winner' }
                    ]
                }).mustHappen(1);
            }
        },
        {
            code: '{jsonsort;testVar;abc;a}',
            expected: '`Not an array`',
            errors: [
                { start: 0, end: 24, error: new NotAnArrayError('testVar') }
            ],
            setup(ctx) {
                const variables = ctx.createMock<VariableStore>();
                ctx.locals.setup(m => m.variables).returns(variables.instance);
                variables.setup(m => m.get('testVar')).returns({ key: '~arrayVar', value: 'xyz' }).mustHappen(1);
            }
        }
    ]
});
