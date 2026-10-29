import type { Variables, VariablesProvider } from '@blargbot/bbtag';
import { RollbackSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';

const variablesProvider = new Mock<VariablesProvider>({ id: 'variablesProvider' });
variablesProvider.setup(m => m.kinds).returns([]);
const variables = new Mock<Variables>({ id: 'variables' });

await runSubtagTests({
    subtag: new RollbackSubtag({
        variables: variablesProvider.instance
    }),
    argCountBounds: { min: 0, max: Infinity },
    names: ['rollback'],
    setup(ctx) {
        ctx.adoptMock(variablesProvider);
        ctx.adoptMock(variables);
        variablesProvider.setup(m => m.forContext(ctx.bbtag)).returns(variables.instance);
    },
    cases: [
        {
            code: '{rollback}',
            setup() {
                variables.setup(m => m.reset(undefined)).returns().mustHappen(1);
            }
        },
        {
            code: '{rollback;var2;~var4;["*var6","@var8"];[];_var10}',
            setup() {
                variables.setup((m, $) => m.reset($(['var2', '~var4', '*var6', '@var8', '_var10']))).returns().mustHappen(1);
            }
        }
    ]
});
