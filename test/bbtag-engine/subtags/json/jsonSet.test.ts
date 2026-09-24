import type { VariablesLocals, VariableStore } from '@blargbot/bbtag-engine';
import { BBTagRuntimeError, replacers } from '@blargbot/bbtag-engine';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests<VariablesLocals>({
    replacer: replacers.jsonSetReplacer,
    argCountBounds: { min: 2, max: 4 },
    cases: [
        {
            code: '{jsonset;{j;{"test": 123, "other": 456}};test}',
            expected: '{"other":456}',
            replacers: [replacers.jsonReplacer]
        },
        {
            code: '{jsonset;{j;{"test": 123, "other": 456}};somethingElse}',
            expected: '{"test":123,"other":456}',
            replacers: [replacers.jsonReplacer]
        },
        {
            code: '{jsonset;null;myProp;123}',
            expected: '',
            setup(ctx) {
                const variables = ctx.createMock<VariableStore>();
                ctx.locals.setup(m => m.variables).returns(variables.instance);
                variables.setup(m => m.get('null')).returns({ key: '~', value: undefined }).mustHappen(1);
                variables.setup((m, $) => m.set('null', $({ myProp: '123' }))).returns().mustHappen(1);
            }
        },
        {
            code: '{jsonset;"abc";myProp;123}',
            expected: '',
            setup(ctx) {
                const variables = ctx.createMock<VariableStore>();
                ctx.locals.setup(m => m.variables).returns(variables.instance);
                variables.setup(m => m.get('"abc"')).returns({ key: '~', value: undefined }).mustHappen(1);
                variables.setup((m, $) => m.set('"abc"', $({ myProp: '123' }))).returns().mustHappen(1);
            }
        },
        {
            code: '{jsonset;true;myProp;123}',
            expected: '',
            setup(ctx) {
                const variables = ctx.createMock<VariableStore>();
                ctx.locals.setup(m => m.variables).returns(variables.instance);
                variables.setup(m => m.get('true')).returns({ key: '~', value: undefined }).mustHappen(1);
                variables.setup((m, $) => m.set('true', $({ myProp: '123' }))).returns().mustHappen(1);
            }
        },
        {
            code: '{jsonset;123;myProp;123}',
            expected: '',
            setup(ctx) {
                const variables = ctx.createMock<VariableStore>();
                ctx.locals.setup(m => m.variables).returns(variables.instance);
                variables.setup(m => m.get('123')).returns({ key: '~', value: undefined }).mustHappen(1);
                variables.setup((m, $) => m.set('123', $({ myProp: '123' }))).returns().mustHappen(1);
            }
        },
        {
            code: '{jsonset;[123,456];somethingElse}',
            expected: '[123,456]'
        },
        {
            code: '{jsonset;[123,456];length}',
            expected: '`Invalid array length`',
            errors: [
                { start: 0, end: 26, error: new BBTagRuntimeError('Invalid array length') }
            ]
        },
        {
            code: '{jsonset;{j;{"test": 123, "other": "{\\"myProp\\":123}"}};other.myProp;10}',
            expected: '`Cannot set property myProp on "{\\"myProp\\":123}"`',
            replacers: [replacers.jsonReplacer],
            errors: [
                { start: 0, end: 72, error: new BBTagRuntimeError('Cannot set property myProp on "{\\"myProp\\":123}"') }
            ]
        },
        {
            code: '{jsonset;{j;{"test": 123, "other": "{\\"myProp\\":123}"}};other.myProp;10;true}',
            expected: '{"test":123,"other":{"myProp":"10"}}',
            replacers: [replacers.jsonReplacer]
        },
        {
            code: '{jsonset;jsonVar;other.myProp;10;true}',
            expected: '',
            setup(ctx) {
                const variables = ctx.createMock<VariableStore>();
                ctx.locals.setup(m => m.variables).returns(variables.instance);
                variables.setup(m => m.get('jsonVar')).returns({ key: '~jsonVar', value: { test: 123, other: '{"myProp":123}' } }).mustHappen(1);
                variables.setup((m, $) => m.set('~jsonVar', $({ test: 123, other: { myProp: '10' } }))).returns().mustHappen(1);
            }
        }
    ]
});
