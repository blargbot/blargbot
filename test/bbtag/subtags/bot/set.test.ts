import type { Variables, VariablesProvider } from '@blargbot/bbtag';
import { SetSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';

import type { SubtagTestCase } from '../SubtagTestSuite.js';
import { runSubtagTests } from '../SubtagTestSuite.js';

const variablesProvider = new Mock<VariablesProvider>({ id: 'variablesProvider' });
variablesProvider.setup(m => m.kinds).returns([]);
const variables = new Mock<Variables>({ id: 'variables' });

await runSubtagTests({
    subtag: new SetSubtag({
        variables: variablesProvider.instance
    }),
    argCountBounds: { min: 1, max: Infinity },
    names: ['set'],
    setup(ctx) {
        ctx.adoptMock(variablesProvider);
        ctx.adoptMock(variables);
    },
    postSetup(bbctx) {
        variablesProvider.setup(m => m.forContext(bbctx)).returns(variables.instance);
    },
    cases: [
        ...createTestCases([
            '~varName',
            'varName',
            '@varName',
            '*varName',
            '_varName'
        ], [
            { args: [], value: undefined },
            { args: ['a'], value: 'a' },
            { args: ['a', 'b', 'c'], value: ['a', 'b', 'c'] },
            { args: ['[1,2,3]'], value: [1, 2, 3] },
            { args: ['[a,b,c]'], value: '[a,b,c]' },
            { args: ['["a","b","c"]'], value: ['a', 'b', 'c'] },
            { args: ['[1,2,3]', 'a', 'b'], value: ['[1,2,3]', 'a', 'b'] }
        ])
    ]
});

function* createTestCases(names: string[], cases: Array<{ args: string[]; value: JToken | undefined; }>): Generator<SubtagTestCase> {
    for (const name of names) {
        for (const { args, value } of cases) {
            yield {
                title: 'When the value isnt forced',
                code: `{set;${[name, ...args].join(';')}}`,
                expected: '',
                setup() {
                    variables.setup((m, $) => m.set(name, $(value))).resolves().mustHappen(1);
                }
            };
            yield {
                title: 'When the value is forced',
                code: `{set;!${[name, ...args].join(';')}}`,
                expected: '',
                setup() {
                    variables.setup((m, $) => m.set(`!${name}`, $(value))).resolves().mustHappen(1);
                }
            };
        }
    }
}
