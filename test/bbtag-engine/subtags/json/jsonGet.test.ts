import type { VariablesLocals, VariableStore } from '@blargbot/bbtag-engine';
import { BBTagRuntimeError, replacers } from '@blargbot/bbtag-engine';

import type { SubtagTestCase } from '../SubtagTestSuite.js';
import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests<VariablesLocals>({
    replacer: replacers.jsonGetReplacer,
    argCountBounds: { min: 1, max: 2 },
    cases: [
        ...generateTestCases({ array: [{ test: { abc: 123 } }] }, 'array.0.test', '{"abc":123}'),
        ...generateTestCases({ array: JSON.stringify([{ test: { abc: 123 } }]) }, 'array.0.test', '{"abc":123}'),
        ...generateTestCases(JSON.stringify({ array: [{ test: { abc: 123 } }] }), 'array.0.test', '{"abc":123}'),
        ...generateTestCases({ n: 'test', v: [{ test: { abc: 123 } }] }, '0.test', '{"abc":123}'),
        {
            code: '{jsonget;10;0.test}',
            expected: '`Cannot read property test of undefined`',
            errors: [
                { start: 0, end: 19, error: new BBTagRuntimeError('Cannot read property test of undefined') }
            ],
            setup(ctx) {
                const variables = ctx.createMock<VariableStore>();
                ctx.locals.setup(m => m.variables).returns(variables.instance).mustHappen();
                variables.setup(m => m.get('10')).returns({ key: '~', value: undefined }).mustHappen();
            }
        },
        {
            code: '{jsonget;"abc";0.test}',
            expected: '`Cannot read property test of undefined`',
            errors: [
                { start: 0, end: 22, error: new BBTagRuntimeError('Cannot read property test of undefined') }
            ],
            setup(ctx) {
                const variables = ctx.createMock<VariableStore>();
                ctx.locals.setup(m => m.variables).returns(variables.instance).mustHappen();
                variables.setup(m => m.get('"abc"')).returns({ key: '~', value: undefined }).mustHappen();
            }
        },
        {
            code: '{jsonget;true;0.test}',
            expected: '`Cannot read property test of undefined`',
            errors: [
                { start: 0, end: 21, error: new BBTagRuntimeError('Cannot read property test of undefined') }
            ],
            setup(ctx) {
                const variables = ctx.createMock<VariableStore>();
                ctx.locals.setup(m => m.variables).returns(variables.instance).mustHappen();
                variables.setup(m => m.get('true')).returns({ key: '~', value: undefined }).mustHappen();
            }
        },
        {
            code: '{jsonget;;someProp}',
            expected: ''
        }
    ]
});

function* generateTestCases(source: JToken, path: string, expected: string): Iterable<SubtagTestCase<VariablesLocals>> {
    yield {
        code: `{jsonget;{j;${JSON.stringify(source)}};${path}}`,
        replacers: [replacers.jsonReplacer],
        expected: expected
    };
    yield {
        code: `{jsonget;myJsonVar;${path}}`,
        expected: expected,
        setup(ctx) {
            const variables = ctx.createMock<VariableStore>();
            ctx.locals.setup(m => m.variables).returns(variables.instance).mustHappen();
            variables.setup(m => m.get('myJsonVar')).returns({ key: '~', value: source }).mustHappen();
        }
    };
    yield {
        code: '{jsonget;myJsonVar}',
        expected: typeof source === 'string' ? source : JSON.stringify(source),
        setup(ctx) {
            const variables = ctx.createMock<VariableStore>();
            ctx.locals.setup(m => m.variables).returns(variables.instance).mustHappen();
            variables.setup(m => m.get('myJsonVar')).returns({ key: '~', value: source }).mustHappen();
        }
    };
}
