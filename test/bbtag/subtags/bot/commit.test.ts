import type { Variables, VariablesProvider } from '@blargbot/bbtag';
import { CommitSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';

const variablesProvider = new Mock<VariablesProvider>({ id: 'variablesProvider' });
variablesProvider.setup(m => m.kinds).returns([]);
const variables = new Mock<Variables>({ id: 'variables' });

await runSubtagTests({
    subtag: new CommitSubtag({
        variables: variablesProvider.instance
    }),
    argCountBounds: { min: 0, max: Infinity },
    names: ['commit'],
    setup(ctx) {
        ctx.adoptMock(variablesProvider);
        ctx.adoptMock(variables);
    },
    postSetup(bbctx) {
        variablesProvider.setup(m => m.forContext(bbctx)).returns(variables.instance);
    },
    cases: [
        {
            code: '{commit}',
            expected: '',
            setup() {
                variables.setup(m => m.persist(undefined)).resolves().mustHappen(1);
            }
        },
        {
            code: '{commit;var1;["~var3","*var5"];[];@var7;_var9}',
            expected: '',
            setup() {
                variables.setup((m, $) => m.persist($(['var1', '~var3', '*var5', '@var7', '_var9']))).resolves().mustHappen(1);
            }
        },
        {
            code: '{commit;var2;["~var4","*var6"];[];@var8;_var10}',
            expected: '',
            setup() {
                variables.setup((m, $) => m.persist($(['var2', '~var4', '*var6', '@var8', '_var10']))).resolves().mustHappen(1);
            }
        },
        {
            code: '{commit;unknown variable}',
            expected: '',
            setup() {
                variables.setup((m, $) => m.persist($(['unknown variable']))).resolves().mustHappen(1);
            }
        }
    ]
});
