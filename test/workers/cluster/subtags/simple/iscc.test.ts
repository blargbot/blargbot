import { IsCCSubtag } from '@cluster/subtags/simple/iscc';

import { runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new IsCCSubtag(),
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
