import { BBTagRuntimeError, replacers } from '@blargbot/bbtag-engine';

import { createTestReplacer, runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    replacer: replacers.injectReplacer,
    argCountBounds: { min: 1, max: 1 },
    cases: [

        {
            code: '{inject;{lb}check1{rb}}',
            replacers: [replacers.lbReplacer, replacers.rbReplacer, createTestReplacer('check1', () => {
                return 'Inject successful';
            })],
            expected: 'Inject successful'
        },
        // TODO: move this test once recursion limits are re-added
        // {
        //     code: '{inject;{lb}assert{rb}}',
        //     subtags: [replacers.lbReplacer, replacers.rbReplacer, new AssertSubtag(ctx => {
        //         assert.equal(ctx.parent, undefined);
        //         assert.equal(ctx.data.stackSize, 123);
        //         return 'Inject successful';
        //     })],
        //     expected: 'Inject successful',
        //     setup(ctx) {
        //         ctx.options.data = { stackSize: 122 };
        //     }
        // },
        {
            code: '{inject;{lb}fail}',
            replacers: [replacers.lbReplacer],
            expected: '`Unmatched \'{\' at 0`',
            errors: [
                { start: 0, end: 17, error: new BBTagRuntimeError('Unmatched \'{\' at 0') }
            ]
        },
        {
            code: '{inject;fail{rb}}',
            replacers: [replacers.rbReplacer],
            expected: '`Unexpected \'}\' at 4`',
            errors: [
                { start: 0, end: 17, error: new BBTagRuntimeError('Unexpected \'}\' at 4') }
            ]
        }
    ]
});
