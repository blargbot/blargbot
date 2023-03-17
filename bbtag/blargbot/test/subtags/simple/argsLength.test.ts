import { ArgsLengthSubtag } from '@bbtag/blargbot/subtags';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: ArgsLengthSubtag,
    argCountBounds: { min: 0, max: 0 },
    cases: [
        {
            code: '{argslength}',
            expected: '0',
            setup(ctx) { ctx.entrypoint.inputRaw = ''; }
        },
        {
            code: '{argslength}',
            expected: '4',
            setup(ctx) { ctx.entrypoint.inputRaw = 'this is a test'; }
        },
        {
            code: '{argslength}',
            expected: '3',
            setup(ctx) { ctx.entrypoint.inputRaw = 'this "is a" test'; }
        }
    ]
});
