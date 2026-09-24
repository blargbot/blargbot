import assert from 'node:assert/strict';

import type { FunctionLocals } from '@blargbot/bbtag-engine';
import { BBTagRuntimeError, parseBBTag, replacers, UnknownSubtagError } from '@blargbot/bbtag-engine';

import { createTestReplacer, runSubtagTests } from '../SubtagTestSuite.js';

const check = parseBBTag('{check1}');
if (check instanceof BBTagRuntimeError)
    throw check;

await runSubtagTests<FunctionLocals>({
    replacer: replacers.funcReplacer,
    argCountBounds: { min: 0, max: Infinity },
    cases: [
        {
            code: '{func.test}',
            expected: 'Success!',
            replacers: [createTestReplacer('check1', ctx => {
                assert.deepEqual(ctx.locals.functionParameters, []);
                return 'Success!';
            })],
            setup(ctx) {
                ctx.locals.setup(m => m.functions).returns({
                    ['func.test']: check
                }).mustHappen();
                ctx.locals.setup(m => m.functionParameters).mustNotHappen();
                ctx.locals.setupSet((m, $) => m.functionParameters = $.anything).mustNotHappen();
            }
        },
        {
            code: '{func.test;arg1;arg2;["arg3","arg3"];arg4;}',
            expected: 'Success!',
            replacers: [createTestReplacer('check1', ctx => {
                assert.deepEqual(ctx.locals.functionParameters, ['arg1', 'arg2', '["arg3","arg3"]', 'arg4', '']);
                return 'Success!';
            })],
            setup(ctx) {
                ctx.locals.setup(m => m.functions).returns({
                    ['func.test']: check
                }).mustHappen();
                ctx.locals.setup(m => m.functionParameters).mustNotHappen();
                ctx.locals.setupSet((m, $) => m.functionParameters = $.anything).mustNotHappen();
            }
        },
        {
            code: '{func.test}',
            expected: '`Unknown subtag func.test`',
            errors: [
                { start: 0, end: 11, error: new UnknownSubtagError('func.test') }
            ],
            setup(ctx) {
                ctx.locals.setup(m => m.functions).returns({}).mustHappen();
                ctx.locals.setup(m => m.functionParameters).mustNotHappen();
                ctx.locals.setupSet((m, $) => m.functionParameters = $.anything).mustNotHappen();
            }
        }
        // TODO: Move this test once recursion detection is reintroduced
        // {
        //     code: '{func.test}',
        //     expected: '`Terminated recursive tag after 200 execs.`',
        //     errors: [
        //         { start: 0, end: 11, error: new SubtagStackOverflowError(200) }
        //     ],
        //     setup(ctx) {
        //         ctx.options.data = { stackSize: 200 };
        //         ctx.rootScope.functions['test'] = bbtag.parse('{assert}');
        //     },
        //     assert(ctx) {
        //         assert.equal(ctx.data.stackSize, 200);
        //         assert.equal(ctx.data.state, BBTagRuntimeState.ABORT);
        //     }
        // }
    ]
});
