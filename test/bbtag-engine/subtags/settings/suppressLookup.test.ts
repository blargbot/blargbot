import assert from 'node:assert/strict';

import type { SuppressLookupLocals } from '@blargbot/bbtag-engine';
import { NotABooleanError, replacers } from '@blargbot/bbtag-engine';

import { createTestReplacer, runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests<SuppressLookupLocals>({
    replacer: replacers.suppressLookupReplacer,
    argCountBounds: { min: 0, max: 1 },
    cases: [
        {
            code: '{suppresslookup}',
            expected: '',
            setup(ctx) {
                ctx.locals.setupSet(m => m.suppressLookup = true).returns(true).mustHappen();
            }
        },
        {
            code: '{suppresslookup;true}',
            expected: '',
            setup(ctx) {
                ctx.locals.setupSet(m => m.suppressLookup = true).returns(true).mustHappen();
            }
        },
        {
            code: '{suppresslookup;false}',
            expected: '',
            setup(ctx) {
                ctx.locals.setupSet(m => m.suppressLookup = false).returns(true).mustHappen();
            }
        },
        {
            code: '{suppresslookup;abc}',
            expected: '`Not a boolean`',
            errors: [
                { start: 0, end: 20, error: new NotABooleanError('abc') }
            ]
        },
        {
            code: '{check1}{scope;{suppressLookup}{check2}}{check3}',
            expected: '123',
            replacers: [
                createTestReplacer('check1', ctx => {
                    assert.equal(ctx.locals.suppressLookup, undefined);
                    return '1';
                }),
                createTestReplacer('check2', ctx => {
                    assert.equal(ctx.locals.suppressLookup, true);
                    return '2';
                }),
                createTestReplacer('check3', ctx => {
                    assert.equal(ctx.locals.suppressLookup, true);
                    return '3';
                }),
                createTestReplacer('scope', (_, args) => args[0].execute())
            ],
            setup(ctx) {
                ctx.locals.setupProperty('suppressLookup', undefined);
            }
        }
    ]
});
