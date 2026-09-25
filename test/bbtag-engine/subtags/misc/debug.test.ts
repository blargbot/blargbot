import type { BBTagSubtag, DebugEntry } from '@blargbot/bbtag-engine';
import { replacers } from '@blargbot/bbtag-engine';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    replacer: replacers.debugReplacer,
    argCountBounds: { min: 0, max: Infinity },
    cases: [
        {
            code: '{debug}',
            expected: '',
            setup(ctx, code) {
                const debug = ctx.createMock<DebugEntry[]>();
                ctx.locals.setup(m => m.debug).returns(debug.instance);
                debug.setup((m, $) => m.push($({
                    text: '',
                    bbtag: $.strict(code.values[0] as BBTagSubtag)
                }))).returns(1).mustHappen(1);
            }
        },
        {
            code: '{debug;some text!}',
            expected: '',
            setup(ctx, code) {
                const debug = ctx.createMock<DebugEntry[]>();
                ctx.locals.setup(m => m.debug).returns(debug.instance);
                debug.setup((m, $) => m.push($({
                    text: 'some text!',
                    bbtag: $.strict(code.values[0] as BBTagSubtag)
                }))).returns(1).mustHappen(1);
            }
        },
        {
            code: '{debug;some text!;and some more;ooh fancy}',
            expected: '',
            setup(ctx, code) {
                const debug = ctx.createMock<DebugEntry[]>();
                ctx.locals.setup(m => m.debug).returns(debug.instance);
                debug.setup((m, $) => m.push($({
                    text: 'some text! and some more ooh fancy',
                    bbtag: $.strict(code.values[0] as BBTagSubtag)
                }))).returns(1).mustHappen(1);
            }
        }
    ]
});
