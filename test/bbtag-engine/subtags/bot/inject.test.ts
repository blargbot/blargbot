import assert from 'node:assert/strict';

import { BBTagRuntimeError, InjectSubtag, LbSubtag, RbSubtag } from '@blargbot/bbtag-engine';

import { AssertSubtag, runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    replacer: replacers.injectReplacer,
    argCountBounds: { min: 1, max: 1 },
    cases: [
        {
            code: '{inject;{lb}assert{rb}}',
            subtags: [replacers.lbReplacer, replacers.rbReplacer, new AssertSubtag(ctx => {
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
            subtags: [replacers.lbReplacer],
            expected: '`Unmatched \'{\' at 0`',
            errors: [
                { start: 0, end: 17, error: new BBTagRuntimeError('Unmatched \'{\' at 0') }
            ]
        },
        {
            code: '{inject;fail{rb}}',
            subtags: [replacers.rbReplacer],
            expected: '`Unexpected \'}\' at 4`',
            errors: [
                { start: 0, end: 17, error: new BBTagRuntimeError('Unexpected \'}\' at 4') }
            ]
        }
    ]
});
