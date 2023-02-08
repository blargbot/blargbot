import { Subtag } from '@bbtag/blargbot';
import { QuietSubtag } from '@bbtag/blargbot/subtags';
import chai from 'chai';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(QuietSubtag),
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
