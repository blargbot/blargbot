import { IsCustomCommandSubtag } from '@blargbot/bbtag/subtags/simple/isCustomCommand';

import { runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new IsCustomCommandSubtag(),
    argCountBounds: { min: 0, max: 0 },
    cases: [
        {
            code: '{iscc}',
            expected: 'true',
            setup(ctx) { ctx.options.isCC = true; }
        },
        {
            code: '{iscc}',
            expected: 'false',
            setup(ctx) { ctx.options.isCC = false; }
        }
    ]
});
