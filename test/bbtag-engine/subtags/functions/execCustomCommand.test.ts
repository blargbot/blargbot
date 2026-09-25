import type { ExecCustomCommandLocals, ExecutableTag } from '@blargbot/bbtag-engine';
import { BBTagRuntimeError, replacers } from '@blargbot/bbtag-engine';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests<ExecCustomCommandLocals>({
    replacer: replacers.execCustomCommandReplacer,
    argCountBounds: { min: 1, max: Infinity },
    cases: [
        {
            code: '{execcc;otherSubtag}',
            expected: 'Success!',
            postSetup(bbCtx, ctx) {
                const mockTag = ctx.createMock<ExecutableTag>();
                ctx.locals.setup(m => m.getCustomCommand('otherSubtag')).returns(mockTag.instance).mustHappen();
                mockTag.setup((m, $) => m.execute(bbCtx, $([]))).returns('Success!').mustHappen();
            }
        },
        {
            code: '{execcc;otherSubtag;}',
            expected: 'Success!',
            postSetup(bbCtx, ctx) {
                const mockTag = ctx.createMock<ExecutableTag>();
                ctx.locals.setup(m => m.getCustomCommand('otherSubtag')).returns(mockTag.instance).mustHappen();
                mockTag.setup((m, $) => m.execute(bbCtx, $([]))).returns('Success!').mustHappen();
            }
        },
        {
            code: '{execcc;otherSubtag;abc;\\"def\\";ghi}',
            expected: 'Success!',
            postSetup(bbCtx, ctx) {
                const mockTag = ctx.createMock<ExecutableTag>();
                ctx.locals.setup(m => m.getCustomCommand('otherSubtag')).returns(mockTag.instance).mustHappen();
                mockTag.setup((m, $) => m.execute(bbCtx, $(['abc', '\\"def\\"', 'ghi']))).returns('Success!').mustHappen();
            }
        },
        {
            code: '{execcc;otherSubtag;abc;{j;{"def":123}}}',
            expected: 'Success!',
            replacers: [replacers.jsonReplacer],
            postSetup(bbCtx, ctx) {
                const mockTag = ctx.createMock<ExecutableTag>();
                ctx.locals.setup(m => m.getCustomCommand('otherSubtag')).returns(mockTag.instance).mustHappen();
                mockTag.setup((m, $) => m.execute(bbCtx, $(['abc', '{"def":123}']))).returns('Success!').mustHappen();
            }
        },
        {
            code: '{execcc;abc}',
            expected: '`CCommand not found: abc`',
            errors: [
                { start: 0, end: 12, error: new BBTagRuntimeError('CCommand not found: abc') }
            ],
            setup(ctx) {
                ctx.locals.setup(m => m.getCustomCommand('abc')).returns(undefined).mustHappen();
            }
        },
        // Move this test to wherever getCustomCommand is properly impelemented.
        // {
        //     code: '{execcc;othersubtag}',
        //     expected: '`Cannot execcc imported tag: othersubtag`',
        //     errors: [
        //         { start: 0, end: 20, error: new BBTagRuntimeError('Cannot execcc imported tag: othersubtag') }
        //     ],
        //     setup(ctx) {
        //         ctx.ccommands['othersubtag'] = {
        //             id: '0',
        //             author: '212097368371683623',
        //             content: '{assert}{eval}',
        //             alias: 'otherSubtag',
        //             cooldown: 7
        //         };
        //     }
        // },
        // TODO: Migrate this test when recursion limits are reintroduced
        // {
        //     code: '{execcc;otherSubtag}',
        //     expected: '`Terminated recursive tag after 200 execs.`',
        //     errors: [
        //         { start: 0, end: 20, error: new SubtagStackOverflowError(200) }
        //     ],
        //     setup(ctx) {
        //         ctx.options.data = { stackSize: 200 };
        //         ctx.ccommands['othersubtag'] = {
        //             id: '0',
        //             author: '212097368371683623',
        //             content: '{fail}',
        //             cooldown: 7
        //         };
        //     },
        //     assert(ctx) {
        //         assert.equal(ctx.data.stackSize, 200);
        //         assert.equal(ctx.data.state, BBTagRuntimeState.ABORT);
        //     }
        // },
        {
            code: '{execcc;otherSubtag;arg1;arg2;-f flag value}',
            expected: 'Success!',
            postSetup(bbCtx, ctx) {
                const mockTag = ctx.createMock<ExecutableTag>();
                ctx.locals.setup(m => m.getCustomCommand('otherSubtag')).returns(mockTag.instance).mustHappen();
                mockTag.setup((m, $) => m.execute(bbCtx, $(['arg1', 'arg2', '-f flag value']))).returns('Success!').mustHappen();
            }
        },
        {
            code: '{execcc;otherSubtag;arg1 arg2 -f flag value}',
            expected: 'Success!',
            postSetup(bbCtx, ctx) {
                const mockTag = ctx.createMock<ExecutableTag>();
                ctx.locals.setup(m => m.getCustomCommand('otherSubtag')).returns(mockTag.instance).mustHappen();
                mockTag.setup((m, $) => m.execute(bbCtx, $(['arg1', 'arg2', '-f', 'flag', 'value']))).returns('Success!').mustHappen();
            }
        },
        {
            code: '{execcc;otherSubtag;arg1 arg2 \\-f flag value}',
            expected: 'Success!',
            postSetup(bbCtx, ctx) {
                const mockTag = ctx.createMock<ExecutableTag>();
                ctx.locals.setup(m => m.getCustomCommand('otherSubtag')).returns(mockTag.instance).mustHappen();
                mockTag.setup((m, $) => m.execute(bbCtx, $(['arg1', 'arg2', '-f', 'flag', 'value']))).returns('Success!').mustHappen();
            }
        }
    ]
});
