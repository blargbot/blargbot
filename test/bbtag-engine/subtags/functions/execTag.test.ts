import type { ExecTagLocals, ExecutableTag } from '@blargbot/bbtag-engine';
import { BBTagRuntimeError, replacers } from '@blargbot/bbtag-engine';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests<ExecTagLocals>({
    replacer: replacers.execTagReplacer,
    argCountBounds: { min: 1, max: Infinity },
    cases: [
        {
            code: '{exec;otherSubtag}',
            expected: 'Success!',
            postSetup(bbCtx, ctx) {
                const mockTag = ctx.createMock<ExecutableTag>();
                ctx.locals.setup(m => m.getTag('otherSubtag')).returns(mockTag.instance).mustHappen();
                mockTag.setup((m, $) => m.execute(bbCtx, $([]))).returns('Success!').mustHappen();
            }
        },
        {
            code: '{exec;otherSubtag;}',
            expected: 'Success!',
            postSetup(bbCtx, ctx) {
                const mockTag = ctx.createMock<ExecutableTag>();
                ctx.locals.setup(m => m.getTag('otherSubtag')).returns(mockTag.instance).mustHappen();
                mockTag.setup((m, $) => m.execute(bbCtx, $([]))).returns('Success!').mustHappen();
            }
        },
        {
            code: '{exec;otherSubtag;abc;\\"def\\";ghi}',
            expected: 'Success!',
            postSetup(bbCtx, ctx) {
                const mockTag = ctx.createMock<ExecutableTag>();
                ctx.locals.setup(m => m.getTag('otherSubtag')).returns(mockTag.instance).mustHappen();
                mockTag.setup((m, $) => m.execute(bbCtx, $(['abc', '\\"def\\"', 'ghi']))).returns('Success!').mustHappen();
            }
        },
        {
            code: '{exec;otherSubtag;abc;{j;{"def":123}}}',
            expected: 'Success!',
            replacers: [replacers.jsonReplacer],
            postSetup(bbCtx, ctx) {
                const mockTag = ctx.createMock<ExecutableTag>();
                ctx.locals.setup(m => m.getTag('otherSubtag')).returns(mockTag.instance).mustHappen();
                mockTag.setup((m, $) => m.execute(bbCtx, $(['abc', '{"def":123}']))).returns('Success!').mustHappen();
            }
        },
        {
            code: '{exec;abc}',
            expected: '`Tag not found: abc`',
            errors: [
                { start: 0, end: 10, error: new BBTagRuntimeError('Tag not found: abc') }
            ],
            setup(ctx) {
                ctx.locals.setup(m => m.getTag('abc')).returns(undefined).mustHappen();
            }
        },
        // TODO: Migrate this test when recursion limits are reintroduced
        // {
        //     code: '{exec;otherSubtag}',
        //     expected: '`Terminated recursive tag after 200 execs.`',
        //     errors: [
        //         { start: 0, end: 18, error: new SubtagStackOverflowError(200) }
        //     ],
        //     setup(ctx) {
        //         ctx.options.data = { stackSize: 200 };
        //         ctx.tags['otherSubtag'] = {
        //             author: '212097368371683623',
        //             content: '{fail}',
        //             name: 'otherSubtag',
        //             lastmodified: new Date(),
        //             uses: 0,
        //             cooldown: 7
        //         };
        //     },
        //     assert(ctx) {
        //         assert.equal(ctx.data.stackSize, 200);
        //         assert.equal(ctx.data.state, BBTagRuntimeState.ABORT);
        //     }
        // },
        {
            code: '{exec;otherSubtag;arg1;arg2;-f flag value}',
            expected: 'Success!',
            postSetup(bbCtx, ctx) {
                const mockTag = ctx.createMock<ExecutableTag>();
                ctx.locals.setup(m => m.getTag('otherSubtag')).returns(mockTag.instance).mustHappen();
                mockTag.setup((m, $) => m.execute(bbCtx, $(['arg1', 'arg2', '-f flag value']))).returns('Success!').mustHappen();
            }
        },
        {
            code: '{exec;otherSubtag;arg1 arg2 -f flag value}',
            expected: 'Success!',
            postSetup(bbCtx, ctx) {
                const mockTag = ctx.createMock<ExecutableTag>();
                ctx.locals.setup(m => m.getTag('otherSubtag')).returns(mockTag.instance).mustHappen();
                mockTag.setup((m, $) => m.execute(bbCtx, $(['arg1', 'arg2', '-f', 'flag', 'value']))).returns('Success!').mustHappen();
            }
        },
        {
            code: '{exec;otherSubtag;arg1 arg2 \\-f flag value}',
            expected: 'Success!',
            postSetup(bbCtx, ctx) {
                const mockTag = ctx.createMock<ExecutableTag>();
                ctx.locals.setup(m => m.getTag('otherSubtag')).returns(mockTag.instance).mustHappen();
                mockTag.setup((m, $) => m.execute(bbCtx, $(['arg1', 'arg2', '-f', 'flag', 'value']))).returns('Success!').mustHappen();
            }
        }
    ]
});
