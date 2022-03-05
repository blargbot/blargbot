import { QuietSubtag } from '@cluster/subtags/bot/quiet';
import { expect } from 'chai';

import { runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new QuietSubtag(),
    argCountBounds: { min: 0, max: 1 },
    cases: [
        {
            code: '{quiet}',
            expected: '',
            assert(ctx) {
                expect(ctx.scopes.local.quiet).to.be.true;
            }
        },
        {
            code: '{quiet;}',
            expected: '',
            assert(ctx) {
                expect(ctx.scopes.local.quiet).to.be.true;
            }
        },
        {
            code: '{quiet;true}',
            expected: '',
            assert(ctx) {
                expect(ctx.scopes.local.quiet).to.be.true;
            }
        },
        {
            code: '{quiet;false}',
            expected: '',
            assert(ctx) {
                expect(ctx.scopes.local.quiet).to.be.false;
            }
        },
        {
            code: '{quiet;abc}',
            expected: '',
            assert(ctx) {
                expect(ctx.scopes.local.quiet).to.be.undefined;
            }
        }
    ]
});
