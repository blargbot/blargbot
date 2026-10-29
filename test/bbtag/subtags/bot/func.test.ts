import assert from 'node:assert/strict';

import { bbtag, BBTagRuntimeState, SubtagStackOverflowError, UnknownSubtagError } from '@blargbot/bbtag';
import { FunctionInvokeSubtag } from '@blargbot/bbtag/subtags';

import { AssertSubtag, runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    subtag: new FunctionInvokeSubtag(),
    argCountBounds: { min: 0, max: Infinity },
    names: ['func.'],
    cases: [
        {
            code: '{func.test}',
            expected: 'Success!',
            subtags: [new AssertSubtag(ctx => {
                assert.deepEqual(ctx.local.paramsarray, []);
                assert.equal(ctx.root.recursion.depth, 123);
                return 'Success!';
            })],
            setup(ctx) {
                ctx.bbtag.root.functions.set('test', bbtag.parse('{assert}'));
                ctx.bbtag.root.recursion.depth = 122;
            },
            assert(ctx) {
                assert.equal(ctx.bbtag.local.paramsarray, undefined);
                assert.equal(ctx.bbtag.root.recursion.depth, 122);
            }
        },
        {
            code: '{func.test;arg1;arg2;["arg3","arg3"];arg4;}',
            expected: 'Success!',
            subtags: [new AssertSubtag(ctx => {
                assert.deepEqual(ctx.local.paramsarray, ['arg1', 'arg2', '["arg3","arg3"]', 'arg4', '']);
                assert.equal(ctx.root.recursion.depth, 123);
                return 'Success!';
            })],
            setup(ctx) {
                ctx.bbtag.root.functions.set('test', bbtag.parse('{assert}'));
                ctx.bbtag.root.recursion.depth = 122;
            },
            assert(ctx) {
                assert.equal(ctx.bbtag.local.paramsarray, undefined);
                assert.equal(ctx.bbtag.root.recursion.depth, 122);
            }
        },
        {
            code: '{func.test}',
            expected: '`Unknown subtag func.test`',
            errors: [
                { error: new UnknownSubtagError('func.test') }
            ]
        },
        {
            code: '{func.test}',
            expected: '`Terminated recursive tag after 200 execs.`',
            errors: [
                { error: new SubtagStackOverflowError(200) }
            ],
            setup(ctx) {
                ctx.bbtag.root.recursion.depth = 200;
                ctx.bbtag.root.functions.set('test', bbtag.parse('{assert}'));
            },
            assert(ctx) {
                assert.equal(ctx.bbtag.root.recursion.depth, 200);
                assert.equal(ctx.bbtag.state, BBTagRuntimeState.ABORT);
            }
        }
    ]
});
