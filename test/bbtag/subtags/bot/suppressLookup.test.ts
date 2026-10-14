import assert from 'node:assert/strict';

import { NotABooleanError } from '@blargbot/bbtag';
import { SuppressLookupSubtag } from '@blargbot/bbtag/subtags';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    subtag: new SuppressLookupSubtag(),
    argCountBounds: { min: 0, max: 1 },
    names: ['suppressLookup'],
    cases: [
        {
            code: '{suppresslookup}',
            expected: '',
            assert(bbctx) {
                assert.equal(bbctx.root.noLookupErrors, true);
            }
        },
        {
            code: '{suppresslookup;true}',
            expected: '',
            assert(bbctx) {
                assert.equal(bbctx.root.noLookupErrors, true);
            }
        },
        {
            code: '{suppresslookup;false}',
            expected: '',
            assert(bbctx) {
                assert.equal(bbctx.root.noLookupErrors, false);
            }
        },
        {
            code: '{suppresslookup;abc}',
            expected: '`Not a boolean`',
            errors: [
                { start: 0, end: 20, error: new NotABooleanError('abc') }
            ],
            assert(bbctx) {
                assert.equal(bbctx.root.noLookupErrors, undefined);
            }
        }
    ]
});
