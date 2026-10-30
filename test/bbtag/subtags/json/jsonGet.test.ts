import type { Variables, VariablesProvider } from '@blargbot/bbtag-engine';
import { BBTagRuntimeError } from '@blargbot/bbtag-engine';
import { JsonGetSubtag, JsonSubtag } from '@blargbot/bbtag-engine/subtags';
import { Mock } from '@blargbot/test-util';

import type { SubtagTestCase } from '../SubtagTestSuite.js';
import { runSubtagTests } from '../SubtagTestSuite.js';

const variablesProvider = new Mock<VariablesProvider>({ id: 'variablesProvider' });
variablesProvider.setup(m => m.kinds).returns([]);
const variables = new Mock<Variables>({ id: 'variables' });

await runSubtagTests({
    subtag: new JsonGetSubtag({
        variables: variablesProvider.instance
    }),
    argCountBounds: { min: 1, max: 2 },
    names: ['jsonGet', 'jGet'],
    setup(ctx) {
        ctx.adoptMock(variablesProvider);
        ctx.adoptMock(variables);
        variablesProvider.setup(m => m.forContext(ctx.bbtag)).returns(variables.instance);
    },
    cases: [
        ...generateTestCases({ array: [{ test: { abc: 123 } }] }, 'array.0.test', '{"abc":123}'),
        ...generateTestCases({ array: JSON.stringify([{ test: { abc: 123 } }]) }, 'array.0.test', '{"abc":123}'),
        ...generateTestCases(JSON.stringify({ array: [{ test: { abc: 123 } }] }), 'array.0.test', '{"abc":123}'),
        ...generateTestCases({ n: 'test', v: [{ test: { abc: 123 } }] }, '0.test', '{"abc":123}'),
        {
            code: '{jsonget;10;0.test}',
            expected: '`Cannot read property test of undefined`',
            errors: [
                { error: new BBTagRuntimeError('Cannot read property test of undefined') }
            ],
            setup() {
                variables.setup(m => m.get('10')).resolves({ key: 'foo', value: undefined }).mustHappen(1);
            }
        },
        {
            code: '{jsonget;"abc";0.test}',
            expected: '`Cannot read property test of undefined`',
            errors: [
                { error: new BBTagRuntimeError('Cannot read property test of undefined') }
            ],
            setup() {
                variables.setup(m => m.get('"abc"')).resolves({ key: 'foo', value: undefined }).mustHappen(1);
            }
        },
        {
            code: '{jsonget;true;0.test}',
            expected: '`Cannot read property test of undefined`',
            errors: [
                { error: new BBTagRuntimeError('Cannot read property test of undefined') }
            ],
            setup() {
                variables.setup(m => m.get('true')).resolves({ key: 'foo', value: undefined }).mustHappen(1);
            }
        },
        {
            code: '{jsonget;;someProp}',
            expected: ''
        }
    ]
});

function* generateTestCases(source: JToken, path: string, expected: string): Iterable<SubtagTestCase> {
    yield {
        code: `{jsonget;{j;${JSON.stringify(source)}};${path}}`,
        subtags: [new JsonSubtag()],
        expected: expected
    };
    yield {
        code: `{jsonget;myJsonVar;${path}}`,
        expected: expected,
        setup() {
            variables.setup(m => m.get('myJsonVar')).resolves({ key: 'foo', value: source }).mustHappen(1);
        }
    };
    yield {
        code: '{jsonget;myJsonVar}',
        expected: typeof source === 'string' ? source : JSON.stringify(source),
        setup() {
            variables.setup(m => m.get('myJsonVar')).resolves({ key: 'foo', value: source }).mustHappen(1);
        }
    };
}
