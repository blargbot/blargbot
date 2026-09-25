import assert from 'node:assert/strict';

import type { QuietLocals } from '@blargbot/bbtag-engine';
import { replacers } from '@blargbot/bbtag-engine';

import { createTestReplacer, runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests<QuietLocals>({
    replacer: replacers.quietReplacer,
    argCountBounds: { min: 0, max: 1 },
    cases: [
        {
            code: '{quiet}',
            expected: '',
            setup(ctx) {
                ctx.locals.setupSet(m => m.quiet = true).returns(true).mustHappen();
            }
        },
        {
            code: '{quiet;}',
            expected: '',
            setup(ctx) {
                ctx.locals.setupSet(m => m.quiet = true).returns(true).mustHappen();
            }
        },
        {
            code: '{quiet;true}',
            expected: '',
            setup(ctx) {
                ctx.locals.setupSet(m => m.quiet = true).returns(true).mustHappen();
            }
        },
        {
            code: '{quiet;false}',
            expected: '',
            setup(ctx) {
                ctx.locals.setupSet(m => m.quiet = false).returns(true).mustHappen();
            }
        },
        {
            code: '{quiet;abc}',
            expected: '',
            setup(ctx) {
                ctx.locals.setupSet(m => m.quiet = undefined).returns(true).mustHappen();
            }
        },
        {
            code: '{check1}{scope;{quiet}{check2}}{check3}',
            expected: '123',
            replacers: [
                createTestReplacer('check1', ctx => {
                    assert.equal(ctx.locals.quiet, undefined);
                    return '1';
                }),
                createTestReplacer('check2', ctx => {
                    assert.equal(ctx.locals.quiet, true);
                    return '2';
                }),
                createTestReplacer('check3', ctx => {
                    assert.equal(ctx.locals.quiet, true);
                    return '3';
                }),
                createTestReplacer('scope', (_, args) => args[0].execute())
            ],
            setup(ctx) {
                ctx.locals.setupProperty('quiet', undefined);
            }
        }
    ]
});
