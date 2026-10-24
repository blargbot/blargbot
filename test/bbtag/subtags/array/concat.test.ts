import type { Variables, VariablesProvider } from '@blargbot/bbtag';
import { ConcatSubtag, GetSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';

const variablesProvider = new Mock<VariablesProvider>({ id: 'variablesProvider' });
variablesProvider.setup(m => m.kinds).returns([]);
const variables = new Mock<Variables>({ id: 'variables' });

await runSubtagTests({
    subtag: new ConcatSubtag(),
    argCountBounds: { min: 1, max: Infinity },
    names: ['concat'],
    setup(ctx) {
        ctx.adoptMock(variablesProvider);
        ctx.adoptMock(variables);
    },
    postSetup(bbctx) {
        variablesProvider.setup(m => m.forContext(bbctx)).returns(variables.instance);
    },
    cases: [
        { code: '{concat;["this", "is"];["an", "array"]}', expected: '["this","is","an","array"]' },
        { code: '{concat;a;b;c;[1, 2, 3]}', expected: '["a","b","c",1,2,3]' },
        {
            code: '{concat;{get;arr1};{get;arr2}}',
            expected: '["this","is","arr1","this","is","arr2"]',
            subtags: [new GetSubtag({ variables: variablesProvider.instance })],
            setup() {
                variables.setup(m => m.get('arr1')).resolves({ key: 'foo', value: ['this', 'is', 'arr1'] }).mustHappen(1);
                variables.setup(m => m.get('arr2')).resolves({ key: 'foo', value: ['this', 'is', 'arr2'] }).mustHappen(1);
            }
        }
    ]
});
