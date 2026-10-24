import type { Variables, VariablesProvider } from '@blargbot/bbtag';
import { BBTagRuntimeError } from '@blargbot/bbtag';
import { JsonSetSubtag, JsonSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';

const variablesProvider = new Mock<VariablesProvider>({ id: 'variablesProvider' });
variablesProvider.setup(m => m.kinds).returns([]);
const variables = new Mock<Variables>({ id: 'variables' });

await runSubtagTests({
    subtag: new JsonSetSubtag({
        variables: variablesProvider.instance
    }),
    argCountBounds: { min: 2, max: 4 },
    names: ['jsonSet', 'jSet'],
    setup(ctx) {
        ctx.adoptMock(variablesProvider);
        ctx.adoptMock(variables);
    },
    postSetup(bbctx) {
        variablesProvider.setup(m => m.forContext(bbctx)).returns(variables.instance);
    },
    cases: [
        {
            code: '{jsonset;{j;{"test": 123, "other": 456}};test}',
            expected: '{"other":456}',
            subtags: [new JsonSubtag()]
        },
        {
            code: '{jsonset;{j;{"test": 123, "other": 456}};somethingElse}',
            expected: '{"test":123,"other":456}',
            subtags: [new JsonSubtag()]
        },
        {
            code: '{jsonset;null;myProp;123}',
            expected: '',
            setup() {
                variables.setup(m => m.get('null')).resolves({ key: 'foo', value: undefined }).mustHappen(1);
                variables.setup((m, $) => m.set('null', $({ myProp: '123' }))).resolves().mustHappen(1);
            }
        },
        {
            code: '{jsonset;"abc";myProp;123}',
            expected: '',
            setup() {
                variables.setup(m => m.get('"abc"')).resolves({ key: 'foo', value: undefined }).mustHappen(1);
                variables.setup((m, $) => m.set('"abc"', $({ myProp: '123' }))).resolves().mustHappen(1);
            }
        },
        {
            code: '{jsonset;true;myProp;123}',
            expected: '',
            setup() {
                variables.setup(m => m.get('true')).resolves({ key: 'foo', value: undefined }).mustHappen(1);
                variables.setup((m, $) => m.set('true', $({ myProp: '123' }))).resolves().mustHappen(1);
            }
        },
        {
            code: '{jsonset;123;myProp;123}',
            expected: '',
            setup() {
                variables.setup(m => m.get('123')).resolves({ key: 'foo', value: undefined }).mustHappen(1);
                variables.setup((m, $) => m.set('123', $({ myProp: '123' }))).resolves().mustHappen(1);
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
                { error: new BBTagRuntimeError('Invalid array length') }
            ]
        },
        {
            code: '{jsonset;{j;{"test": 123, "other": "{\\"myProp\\":123}"}};other.myProp;10}',
            expected: '`Cannot set property myProp on "{\\"myProp\\":123}"`',
            subtags: [new JsonSubtag()],
            errors: [
                { error: new BBTagRuntimeError('Cannot set property myProp on "{\\"myProp\\":123}"') }
            ]
        },
        {
            code: '{jsonset;{j;{"test": 123, "other": "{\\"myProp\\":123}"}};other.myProp;10;true}',
            expected: '{"test":123,"other":{"myProp":"10"}}',
            subtags: [new JsonSubtag()]
        },
        {
            code: '{jsonset;jsonVar;other.myProp;10;true}',
            expected: '',
            setup() {
                variables.setup(m => m.get('jsonVar')).resolves({ key: 'foo', value: { test: 123, other: JSON.stringify({ myProp: 123 }) } }).mustHappen(1);
                variables.setup((m, $) => m.set('jsonVar', $({ test: 123, other: { myProp: '10' } }))).resolves().mustHappen(1);
            }
        }
    ]
});
