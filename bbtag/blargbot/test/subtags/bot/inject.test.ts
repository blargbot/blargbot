import { InjectSubtag, LbSubtag, RbSubtag } from '@bbtag/blargbot/subtags';
import { PromiseCompletionSource } from '@blargbot/async-tools';
import chai from 'chai';

import { makeAssertSubtag, runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: InjectSubtag,
    argCountBounds: { min: 1, max: 1 },
    cases: [
        {
            code: '{inject;{lb}assert{rb}}',
            subtags: [LbSubtag, RbSubtag, makeAssertSubtag(ctx => {
                chai.expect(ctx.runtime.moduleCount).to.equal(124);
                return 'Inject successful';
            })],
            expected: 'Inject successful',
            postSetup(bbctx) {
                const neverResolve = new PromiseCompletionSource();
                for (let i = 0; i < 122; i++)
                    void bbctx.runtime.withModule(() => neverResolve);
            }
        },
        {
            code: '{inject;{lb}fail}',
            subtags: [LbSubtag],
            expected: '`Unmatched \'{\' at 0`'
        },
        {
            code: '{inject;fail{rb}}',
            subtags: [RbSubtag],
            expected: '`Unexpected \'}\' at 4`'
        }
    ]
});
