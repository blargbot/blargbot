import type { VariablesLocals, VariableStore } from '@blargbot/bbtag-engine';
import { replacers } from '@blargbot/bbtag-engine';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests<VariablesLocals>({
    replacer: replacers.commitReplacer,
    argCountBounds: { min: 0, max: Infinity },
    cases: [
        {
            code: '{commit}',
            expected: '',
            setup(ctx) {
                const variables = ctx.createMock<VariableStore>();
                ctx.locals.setup(m => m.variables).returns(variables.instance);
                variables.setup(m => m.commit()).returns().mustHappen();
            }
        },
        {
            code: '{commit;var1;["~var3","*var5"];[];@var7;_var9}',
            expected: '',
            setup(ctx) {
                const variables = ctx.createMock<VariableStore>();
                ctx.locals.setup(m => m.variables).returns(variables.instance);
                variables.setup((m, $) => m.commit($(['var1', '~var3', '*var5', '@var7', '_var9']))).returns().mustHappen();
            }
        },
        {
            code: '{commit;var1}',
            expected: '',
            setup(ctx) {
                const variables = ctx.createMock<VariableStore>();
                ctx.locals.setup(m => m.variables).returns(variables.instance);
                variables.setup((m, $) => m.commit($(['var1']))).returns().mustHappen();
            }
        },
        {
            code: '{commit;[]}',
            expected: '',
            setup(ctx) {
                const variables = ctx.createMock<VariableStore>();
                ctx.locals.setup(m => m.variables).returns(variables.instance);
                variables.setup((m, $) => m.commit($([]))).returns().mustHappen();
            }
        },
        {
            code: '{commit;[{escape;{"test": true}}]}',
            expected: '',
            replacers: [replacers.escapeBBTagReplacer],
            setup(ctx) {
                const variables = ctx.createMock<VariableStore>();
                ctx.locals.setup(m => m.variables).returns(variables.instance);
                variables.setup((m, $) => m.commit($(['{"test":true}']))).returns().mustHappen();
            }
        }
    ]
});
