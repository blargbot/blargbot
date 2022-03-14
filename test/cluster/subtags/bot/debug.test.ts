import { DebugSubtag } from '@cluster/subtags/bot/debug';
import { expect } from 'chai';

import { runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new DebugSubtag(),
    argCountBounds: { min: 0, max: Infinity },
    cases: [
        {
            code: '{debug}',
            expected: '',
            assert(ctx) {
                expect(ctx.debug).to.have.length(1);
                expect(ctx.debug[0].text).to.equal('');
                expect(ctx.debug[0].subtag.start.index).to.equal(0);
                expect(ctx.debug[0].subtag.end.index).to.equal(7);
            }
        },
        {
            code: '{debug;some text!}',
            expected: '',
            assert(ctx) {
                expect(ctx.debug).to.have.length(1);
                expect(ctx.debug[0].text).to.equal('some text!');
                expect(ctx.debug[0].subtag.start.index).to.equal(0);
                expect(ctx.debug[0].subtag.end.index).to.equal(18);
            }
        },
        {
            code: '{debug;some text!;and some more;ooh fancy}',
            expected: '',
            assert(ctx) {
                expect(ctx.debug).to.have.length(1);
                expect(ctx.debug[0].text).to.equal('some text! and some more ooh fancy');
                expect(ctx.debug[0].subtag.start.index).to.equal(0);
                expect(ctx.debug[0].subtag.end.index).to.equal(42);
            }
        }
    ]
});
