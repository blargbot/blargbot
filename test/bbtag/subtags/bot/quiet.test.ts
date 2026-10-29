import { QuietSubtag } from '@blargbot/bbtag/subtags';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    subtag: new QuietSubtag(),
    argCountBounds: { min: 0, max: 1 },
    names: ['quiet'],
    cases: [
        {
            code: '{quiet}',
            expected: '',
            setup(ctx) {
                ctx.root.setupSet(m => m.quiet = true).mustHappen(1);
            }
        },
        {
            code: '{quiet;}',
            expected: '',
            setup(ctx) {
                ctx.root.setupSet(m => m.quiet = true).mustHappen(1);
            }
        },
        {
            code: '{quiet;true}',
            expected: '',
            setup(ctx) {
                ctx.root.setupSet(m => m.quiet = true).mustHappen(1);
            }
        },
        {
            code: '{quiet;false}',
            expected: '',
            setup(ctx) {
                ctx.root.setupSet(m => m.quiet = false).mustHappen(1);
            }
        },
        {
            code: '{quiet;abc}',
            expected: '',
            setup(ctx) {
                ctx.root.setupSet(m => m.quiet = undefined).mustHappen(1);
            }
        }
    ]
});
