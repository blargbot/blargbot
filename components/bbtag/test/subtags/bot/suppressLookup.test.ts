import { Subtag } from '@blargbot/bbtag';
import { NotABooleanError } from '@blargbot/bbtag/errors/index.js';
import { SuppressLookupSubtag } from '@blargbot/bbtag/subtags/bot/suppressLookup.js';
import chai from 'chai';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(SuppressLookupSubtag),
    argCountBounds: { min: 0, max: 1 },
    cases: [
        {
            code: '{suppresslookup}',
            expected: '',
            assert(bbctx) {
                chai.expect(bbctx.scopes.root.noLookupErrors).to.be.true;
            }
        },
        {
            code: '{suppresslookup;true}',
            expected: '',
            assert(bbctx) {
                chai.expect(bbctx.scopes.root.noLookupErrors).to.be.true;
            }
        },
        {
            code: '{suppresslookup;false}',
            expected: '',
            assert(bbctx) {
                chai.expect(bbctx.scopes.root.noLookupErrors).to.be.false;
            }
        },
        {
            code: '{suppresslookup;abc}',
            expected: '`Not a boolean`',
            errors: [
                { start: 0, end: 20, error: new NotABooleanError('abc') }
            ],
            assert(bbctx) {
                chai.expect(bbctx.scopes.root.noLookupErrors).to.be.undefined;
            }
        }
    ]
});
