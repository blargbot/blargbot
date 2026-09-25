import assert from 'node:assert/strict';

import type { ReasonLocals } from '@blargbot/bbtag-engine';
import { replacers } from '@blargbot/bbtag-engine';

import { createTestReplacer, runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests<ReasonLocals>({
    replacer: replacers.reasonReplacer,
    argCountBounds: { min: 0, max: 1 },
    cases: [
        {
            code: '{reason}',
            expected: '',
            setup(ctx) {
                ctx.locals.setupSet(m => m.reason = '').returns(true).mustHappen();
            }
        },
        {
            code: '{reason;}',
            expected: '',
            setup(ctx) {
                ctx.locals.setupSet(m => m.reason = '').returns(true).mustHappen();
            }
        },
        {
            code: '{reason;Because i can}',
            expected: '',
            setup(ctx) {
                ctx.locals.setupSet(m => m.reason = 'Because i can').returns(true).mustHappen();
            }
        },
        {
            code: '{check1}{scope;{reason;success}{check2}}{check3}',
            expected: '123',
            replacers: [
                createTestReplacer('check1', ctx => {
                    assert.equal(ctx.locals.reason, undefined);
                    return '1';
                }),
                createTestReplacer('check2', ctx => {
                    assert.equal(ctx.locals.reason, 'success');
                    return '2';
                }),
                createTestReplacer('check3', ctx => {
                    assert.equal(ctx.locals.reason, 'success');
                    return '3';
                }),
                createTestReplacer('scope', (_, args) => args[0].execute())
            ],
            setup(ctx) {
                ctx.locals.setupProperty('reason', undefined);
            }
        }
    ]
});
