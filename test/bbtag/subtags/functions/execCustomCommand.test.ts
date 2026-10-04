import type { ExecCustomCommandLocals, ExecutableTag } from '@blargbot/bbtag-engine';
import { BBTagRuntimeError, replacers } from '@blargbot/bbtag-engine';
import type { Mock } from '@blargbot/test-util';

import { runSubtagTests, type SubtagTestContext } from '../SubtagTestSuite.js';

await runSubtagTests<ExecCustomCommandLocals>({
    replacer: replacers.execCustomCommandReplacer,
    names: ['execCustomCommand', 'execCC'],
    argCountBounds: { min: 1, max: Infinity },
    cases: [
        {
            code: '{execcc;OtherSubtag}',
            expected: 'Success!',
            setup(ctx) {
                const mockTag = createMockTag(ctx);
                ctx.locals.setup(m => m.getCustomCommand('OtherSubtag')).returns(mockTag.instance).mustHappen();
                mockTag.setup((m, $) => m.execute(ctx.instance, $([]))).returns('Success!').mustHappen();
            }
        },
        {
            code: '{execcc;otherSubtag;}',
            expected: 'Success!',
            setup(ctx) {
                const mockTag = createMockTag(ctx);
                ctx.locals.setup(m => m.getCustomCommand('otherSubtag')).returns(mockTag.instance).mustHappen();
                mockTag.setup((m, $) => m.execute(ctx.instance, $([]))).returns('Success!').mustHappen();
            }
        },
        {
            code: '{execcc;otherSubtag;abc;\\"def\\";ghi}',
            expected: 'Success!',
            setup(ctx) {
                const mockTag = createMockTag(ctx);
                ctx.locals.setup(m => m.getCustomCommand('otherSubtag')).returns(mockTag.instance).mustHappen();
                mockTag.setup((m, $) => m.execute(ctx.instance, $(['abc', '\\"def\\"', 'ghi']))).returns('Success!').mustHappen();
            }
        },
        {
            code: '{execcc;otherSubtag;abc;{j;{"def":123}}}',
            expected: 'Success!',
            replacers: [replacers.jsonReplacer],
            setup(ctx) {
                const mockTag = createMockTag(ctx);
                ctx.locals.setup(m => m.getCustomCommand('otherSubtag')).returns(mockTag.instance).mustHappen();
                mockTag.setup((m, $) => m.execute(ctx.instance, $(['abc', '{"def":123}']))).returns('Success!').mustHappen();
            }
        },
        {
            code: '{execcc;abc}',
            expected: '`CCommand not found: abc`',
            errors: [
                { start: 0, end: 12, error: new BBTagRuntimeError('CCommand not found: abc') }
            ],
            setup(ctx) {
                ctx.locals.setup(m => m.getCustomCommand('abc')).returns(null).mustHappen();
            }
        },
        {
            code: '{execcc;OtherSubtag}',
            expected: '`Cannot execcc imported tag: OtherSubtag`',
            errors: [
                { start: 0, end: 20, error: new BBTagRuntimeError('Cannot execcc imported tag: OtherSubtag') }
            ],
            setup(ctx) {
                const mockTag = createMockTag(ctx, true);
                ctx.locals.setup(m => m.getCustomCommand('OtherSubtag')).returns(mockTag.instance).mustHappen();
            }
        },
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
            setup(ctx) {
                const mockTag = createMockTag(ctx);
                ctx.locals.setup(m => m.getCustomCommand('otherSubtag')).returns(mockTag.instance).mustHappen();
                mockTag.setup((m, $) => m.execute(ctx.instance, $(['arg1', 'arg2', '-f flag value']))).returns('Success!').mustHappen();
            }
        },
        {
            code: '{execcc;otherSubtag;arg1 arg2 -f flag value}',
            expected: 'Success!',
            setup(ctx) {
                const mockTag = createMockTag(ctx);
                ctx.locals.setup(m => m.getCustomCommand('otherSubtag')).returns(mockTag.instance).mustHappen();
                mockTag.setup((m, $) => m.execute(ctx.instance, $(['arg1', 'arg2', '-f', 'flag', 'value']))).returns('Success!').mustHappen();
            }
        },
        {
            code: '{execcc;otherSubtag;arg1 arg2 \\-f flag value}',
            expected: 'Success!',
            setup(ctx) {
                const mockTag = createMockTag(ctx);
                ctx.locals.setup(m => m.getCustomCommand('otherSubtag')).returns(mockTag.instance).mustHappen();
                mockTag.setup((m, $) => m.execute(ctx.instance, $(['arg1', 'arg2', '-f', 'flag', 'value']))).returns('Success!').mustHappen();
            }
        }
    ]
});

function createMockTag(ctx: SubtagTestContext<ExecCustomCommandLocals>, isAlias = false): Mock<ExecutableTag> {
    const mockTag = ctx.createMock<ExecutableTag>();
    mockTag.setup(m => m.isAlias).returns(isAlias).mustHappen();
    return mockTag;
}
