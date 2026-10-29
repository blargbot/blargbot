import type { Variables, VariablesProvider } from '@blargbot/bbtag';
import { BBTagRuntimeError } from '@blargbot/bbtag';
import { JsonSubtag, JsonValuesSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';

const variablesProvider = new Mock<VariablesProvider>({ id: 'variablesProvider' });
variablesProvider.setup(m => m.kinds).returns([]);
const variables = new Mock<Variables>({ id: 'variables' });

await runSubtagTests({
    subtag: new JsonValuesSubtag({
        variables: variablesProvider.instance
    }),
    argCountBounds: { min: 1, max: 2 },
    names: ['jsonValues', 'jValues'],
    setup(ctx) {
        ctx.adoptMock(variablesProvider);
        ctx.adoptMock(variables);
        variablesProvider.setup(m => m.forContext(ctx.bbtag)).returns(variables.instance);
    },
    cases: [
        {
            code: '{jsonvalues;{j;{"abc":1,"def":2,"ghi":3}}}',
            expected: '[1,2,3]',
            subtags: [new JsonSubtag()]
        },
        {
            code: '{jsonvalues;~myJsonVar}',
            expected: '[1,2,3]',
            subtags: [new JsonSubtag()],
            setup() {
                variables.setup(m => m.get('~myJsonVar')).resolves({ key: 'foo', value: { abc: 1, def: 2, ghi: 3 } });
            }
        },
        {
            code: '{jsonvalues;["a","bcd","ef"]}',
            expected: '["a","bcd","ef"]'
        },
        {
            code: '{jsonvalues;{j;{"some":{"path":{"to":{"the":123,"answer":{}}}}}};some.path.to}',
            expected: '[123,{}]',
            subtags: [new JsonSubtag()]
        },
        {
            code: '{jsonvalues;{j;{"n":"abc","v":[{"test":{"a":0,"b":1}}]}}}',
            expected: '["abc",[{"test":{"a":0,"b":1}}]]',
            subtags: [new JsonSubtag()]
        },
        {
            code: '{jsonvalues;{j;{"n":"abc","v":[{"test":{"a":0,"b":1}}]}};0.test}',
            expected: '[0,1]',
            subtags: [new JsonSubtag()]
        },
        {
            code: '{jsonvalues;{j;{"some":{"path":{}}}};some.path.to}',
            expected: '[]',
            subtags: [new JsonSubtag()]
        },
        {
            code: '{jsonvalues;{j;{"some":{}}};some.path.to}',
            expected: '`Cannot read property to of undefined`',
            subtags: [new JsonSubtag()],
            errors: [
                { error: new BBTagRuntimeError('Cannot read property to of undefined') }
            ]
        }
    ]
});
