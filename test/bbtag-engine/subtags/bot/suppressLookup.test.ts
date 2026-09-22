import assert from 'node:assert/strict';

import { NotABooleanError, replacers } from '@blargbot/bbtag-engine';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    replacer: replacers.suppressLookupReplacer,
    argCountBounds: { min: 0, max: 1 },
    cases: [
        {
            code: '{suppresslookup}',
            expected: '',
            assert(bbctx) {
                assert.equal(bbctx.scopes.root.noLookupErrors, true);
            }
        },
        {
            code: '{suppresslookup;true}',
            expected: '',
            assert(bbctx) {
                assert.equal(bbctx.scopes.root.noLookupErrors, true);
            }
        },
        {
            code: '{suppresslookup;false}',
            expected: '',
            assert(bbctx) {
                assert.equal(bbctx.scopes.root.noLookupErrors, false);
            }
        },
        {
            code: '{suppresslookup;abc}',
            expected: '`Not a boolean`',
            errors: [
                { start: 0, end: 20, error: new NotABooleanError('abc') }
            ],
            assert(bbctx) {
                assert.equal(bbctx.scopes.root.noLookupErrors, undefined);
            }
        }
    ]
});
