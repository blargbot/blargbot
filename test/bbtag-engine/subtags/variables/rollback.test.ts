import type { VariablesLocals, VariableStore } from '@blargbot/bbtag-engine';
import { replacers } from '@blargbot/bbtag-engine';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests<VariablesLocals>({
    replacer: replacers.rollbackReplacer,
    argCountBounds: { min: 0, max: Infinity },
    cases: [
        {
            code: '{rollback}',
            expected: '',
            setup(ctx) {
                const variables = ctx.createMock<VariableStore>();
                ctx.locals.setup(m => m.variables).returns(variables.instance);
                variables.setup(m => m.rollback()).returns().mustHappen();
            }
        },
        {
            code: '{rollback;var1;["~var3","*var5"];[];@var7;_var9}',
            expected: '',
            setup(ctx) {
                const variables = ctx.createMock<VariableStore>();
                ctx.locals.setup(m => m.variables).returns(variables.instance);
                variables.setup((m, $) => m.rollback($(['var1', '~var3', '*var5', '@var7', '_var9']))).returns().mustHappen();
            }
        },
        {
            code: '{rollback;var1}',
            expected: '',
            setup(ctx) {
                const variables = ctx.createMock<VariableStore>();
                ctx.locals.setup(m => m.variables).returns(variables.instance);
                variables.setup((m, $) => m.rollback($(['var1']))).returns().mustHappen();
            }
        },
        {
            code: '{rollback;[]}',
            expected: '',
            setup(ctx) {
                const variables = ctx.createMock<VariableStore>();
                ctx.locals.setup(m => m.variables).returns(variables.instance);
                variables.setup((m, $) => m.rollback($([]))).returns().mustHappen();
            }
        },
        {
            code: '{rollback;[{escape;{"test": true}}]}',
            expected: '',
            replacers: [replacers.escapeBBTagReplacer],
            setup(ctx) {
                const variables = ctx.createMock<VariableStore>();
                ctx.locals.setup(m => m.variables).returns(variables.instance);
                variables.setup((m, $) => m.rollback($(['{"test":true}']))).returns().mustHappen();
            }
        }
    ]
});
