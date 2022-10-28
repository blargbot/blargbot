import { NotABooleanError } from '@blargbot/bbtag/errors';
import { SuppressLookupSubtag } from '@blargbot/bbtag/subtags/bot/suppressLookup';
import { expect } from 'chai';

import { runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new SuppressLookupSubtag(),
    argCountBounds: { min: 0, max: 1 },
    cases: [
        {
            code: '{suppresslookup}',
            expected: '',
            assert(bbctx) {
                expect(bbctx.scopes.root.noLookupErrors).to.be.true;
            }
        },
        {
            code: '{suppresslookup;true}',
            expected: '',
            assert(bbctx) {
                expect(bbctx.scopes.root.noLookupErrors).to.be.true;
            }
        },
        {
            code: '{suppresslookup;false}',
            expected: '',
            assert(bbctx) {
                expect(bbctx.scopes.root.noLookupErrors).to.be.false;
            }
        },
        {
            code: '{suppresslookup;abc}',
            expected: '`Not a boolean`',
            errors: [
                { start: 0, end: 20, error: new NotABooleanError('abc') }
            ],
            assert(bbctx) {
                expect(bbctx.scopes.root.noLookupErrors).to.be.undefined;
            }
        }
    ]
});
