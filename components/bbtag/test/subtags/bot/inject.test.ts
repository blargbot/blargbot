import { BBTagRuntimeError, Subtag  } from '@blargbot/bbtag';
import { InjectSubtag, LbSubtag, RbSubtag } from '@blargbot/bbtag/subtags';
import chai from 'chai';

import { AssertSubtag, createDescriptor, runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(InjectSubtag),
    argCountBounds: { min: 1, max: 1 },
    cases: [
        {
            code: '{inject;{lb}assert{rb}}',
            subtags: [Subtag.getDescriptor(LbSubtag), Subtag.getDescriptor(RbSubtag), createDescriptor(new AssertSubtag(ctx => {
                chai.expect(ctx.parent).to.be.undefined;
                chai.expect(ctx.data.stackSize).to.equal(123);
                return 'Inject successful';
            }))],
            expected: 'Inject successful',
            setup(ctx) {
                ctx.options.data = { stackSize: 122 };
            }
        },
        {
            code: '{inject;{lb}fail}',
            subtags: [Subtag.getDescriptor(LbSubtag)],
            expected: '`Unmatched \'{\' at 0`',
            errors: [
                { start: 0, end: 17, error: new BBTagRuntimeError('Unmatched \'{\' at 0') }
            ]
        },
        {
            code: '{inject;fail{rb}}',
            subtags: [Subtag.getDescriptor(RbSubtag)],
            expected: '`Unexpected \'}\' at 4`',
            errors: [
                { start: 0, end: 17, error: new BBTagRuntimeError('Unexpected \'}\' at 4') }
            ]
        }
    ]
});