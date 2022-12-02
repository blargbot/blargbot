import { QuietSubtag } from '@blargbot/bbtag/subtags/bot/quiet.js';
import chai from 'chai';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: new QuietSubtag(),
    argCountBounds: { min: 0, max: 1 },
    cases: [
        {
            code: '{quiet}',
            expected: '',
            assert(ctx) {
                chai.expect(ctx.scopes.local.quiet).to.be.true;
            }
        },
        {
            code: '{quiet;}',
            expected: '',
            assert(ctx) {
                chai.expect(ctx.scopes.local.quiet).to.be.true;
            }
        },
        {
            code: '{quiet;true}',
            expected: '',
            assert(ctx) {
                chai.expect(ctx.scopes.local.quiet).to.be.true;
            }
        },
        {
            code: '{quiet;false}',
            expected: '',
            assert(ctx) {
                chai.expect(ctx.scopes.local.quiet).to.be.false;
            }
        },
        {
            code: '{quiet;abc}',
            expected: '',
            assert(ctx) {
                chai.expect(ctx.scopes.local.quiet).to.be.undefined;
            }
        }
    ]
});
