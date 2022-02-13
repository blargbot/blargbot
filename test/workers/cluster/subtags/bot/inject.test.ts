import { BBTagRuntimeError } from '@cluster/bbtag/errors';
import { InjectSubtag } from '@cluster/subtags/bot/inject';
import { LbSubtag } from '@cluster/subtags/simple/lb';
import { RbSubtag } from '@cluster/subtags/simple/rb';
import { expect } from 'chai';

import { AssertSubtag, runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new InjectSubtag(),
    argCountBounds: { min: 1, max: 1 },
    cases: [
        {
            code: '{inject;{lb}assert{rb}}',
            subtags: [new LbSubtag(), new RbSubtag(), new AssertSubtag(ctx => {
                expect(ctx.parent).to.be.undefined;
                expect(ctx.state.stackSize).to.equal(123);
                return 'Inject successful';
            })],
            expected: 'Inject successful',
            setup(ctx) {
                ctx.options.state = { stackSize: 122 };
            }
        },
        {
            code: '{inject;{lb}fail}',
            subtags: [new LbSubtag()],
            expected: '`Unmatched \'{\' at 0`',
            errors: [
                { start: 0, end: 17, error: new BBTagRuntimeError('Unmatched \'{\' at 0') }
            ]
        },
        {
            code: '{inject;fail{rb}}',
            subtags: [new RbSubtag()],
            expected: '`Unexpected \'}\' at 4`',
            errors: [
                { start: 0, end: 17, error: new BBTagRuntimeError('Unexpected \'}\' at 4') }
            ]
        }
    ]
});
