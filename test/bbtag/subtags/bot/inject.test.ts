import assert from 'node:assert/strict';

import { BBTagRuntimeError } from '@blargbot/bbtag';
import { InjectSubtag, LbSubtag, RbSubtag } from '@blargbot/bbtag/subtags';

import { AssertSubtag, runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    subtag: new InjectSubtag(),
    argCountBounds: { min: 1, max: 1 },
    cases: [
        {
            code: '{inject;{lb}assert{rb}}',
            subtags: [new LbSubtag(), new RbSubtag(), new AssertSubtag(ctx => {
                assert.equal(ctx.parent, undefined);
                assert.equal(ctx.data.stackSize, 123);
                return 'Inject successful';
            })],
            expected: 'Inject successful',
            setup(ctx) {
                ctx.options.data = { stackSize: 122 };
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
