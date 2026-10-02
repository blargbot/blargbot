import type { VariablesLocals } from '@blargbot/bbtag-engine';
import { replacers } from '@blargbot/bbtag-engine';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests<VariablesLocals>({
    replacer: replacers.commitReplacer,
    names: ['commit'],
    argCountBounds: { min: 0, max: Infinity },
    cases: [
        {
            code: '{commit}',
            expected: '',
            setup(ctx) {
                ctx.variables.setup(m => m.commit()).returns().mustHappen();
            }
        },
        {
            code: '{commit;var1;["~var3","*var5"];[];@var7;_var9}',
            expected: '',
            setup(ctx) {
                ctx.variables.setup((m, $) => m.commit($(['var1', '~var3', '*var5', '@var7', '_var9']))).returns().mustHappen();
            }
        },
        {
            code: '{commit;var1}',
            expected: '',
            setup(ctx) {
                ctx.variables.setup((m, $) => m.commit($(['var1']))).returns().mustHappen();
            }
        },
        {
            code: '{commit;[]}',
            expected: '',
            setup(ctx) {
                ctx.variables.setup((m, $) => m.commit($([]))).returns().mustHappen();
            }
        },
        {
            code: '{commit;[{escape;{"test": true}}]}',
            expected: '',
            replacers: [replacers.escapeBBTagReplacer],
            setup(ctx) {
                ctx.variables.setup((m, $) => m.commit($(['{"test":true}']))).returns().mustHappen();
            }
        }
    ]
});
