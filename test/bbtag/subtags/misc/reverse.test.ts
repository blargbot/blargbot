import type { Variables, VariablesProvider } from '@blargbot/bbtag-engine';
import { GetSubtag, ReverseSubtag } from '@blargbot/bbtag-engine/subtags';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';

const variablesProvider = new Mock<VariablesProvider>({ id: 'variablesProvider' });
variablesProvider.setup(m => m.kinds).returns([]);
const variables = new Mock<Variables>({ id: 'variables' });

await runSubtagTests({
    subtag: new ReverseSubtag({
        variables: variablesProvider.instance
    }),
    argCountBounds: { min: 1, max: 1 },
    names: ['reverse'],
    setup(ctx) {
        ctx.adoptMock(variablesProvider);
        ctx.adoptMock(variables);
        variablesProvider.setup(m => m.forContext(ctx.bbtag)).returns(variables.instance);
    },
    cases: [
        { code: '{reverse;abcdefg}', expected: 'gfedcba' },
        { code: '{reverse;[10,20,30,40,50,60]}', expected: '[60,50,40,30,20,10]' },
        { code: '{reverse;_myArray}', expected: 'yarrAym_' },
        {
            code: '{reverse;{get;_myArray}}',
            expected: '',
            subtags: [new GetSubtag({ variables: variablesProvider.instance })],
            setup() {
                variables.setup(m => m.get('_myArray')).resolves({ key: '_myArray', value: ['abc', 'def', 'ghi'] }).mustHappen(1);
                variables.setup((m, $) => m.set('_myArray', $(['ghi', 'def', 'abc']))).resolves().mustHappen(1);
            }
        }
    ]
});
