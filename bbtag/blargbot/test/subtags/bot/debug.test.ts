import { Subtag } from '@bbtag/blargbot';
import { DebugSubtag } from '@bbtag/blargbot/subtags';
import chai from 'chai';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(DebugSubtag),
    argCountBounds: { min: 0, max: Infinity },
    cases: [
        {
            code: '{debug}',
            expected: '',
            assert(ctx) {
                chai.expect(ctx.debug).to.have.length(1);
                chai.expect(ctx.debug[0].text).to.equal('');
                chai.expect(ctx.debug[0].subtag.start.index).to.equal(0);
                chai.expect(ctx.debug[0].subtag.end.index).to.equal(7);
            }
        },
        {
            code: '{debug;some text!}',
            expected: '',
            assert(ctx) {
                chai.expect(ctx.debug).to.have.length(1);
                chai.expect(ctx.debug[0].text).to.equal('some text!');
                chai.expect(ctx.debug[0].subtag.start.index).to.equal(0);
                chai.expect(ctx.debug[0].subtag.end.index).to.equal(18);
            }
        },
        {
            code: '{debug;some text!;and some more;ooh fancy}',
            expected: '',
            assert(ctx) {
                chai.expect(ctx.debug).to.have.length(1);
                chai.expect(ctx.debug[0].text).to.equal('some text! and some more ooh fancy');
                chai.expect(ctx.debug[0].subtag.start.index).to.equal(0);
                chai.expect(ctx.debug[0].subtag.end.index).to.equal(42);
            }
        }
    ]
});
