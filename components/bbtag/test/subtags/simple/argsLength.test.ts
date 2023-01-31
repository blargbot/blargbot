import { Subtag } from '@blargbot/bbtag';
import { ArgsLengthSubtag } from '@blargbot/bbtag/subtags';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(ArgsLengthSubtag),
    argCountBounds: { min: 0, max: 0 },
    cases: [
        {
            code: '{argslength}',
            expected: '0',
            setup(ctx) { ctx.options.inputRaw = ''; }
        },
        {
            code: '{argslength}',
            expected: '4',
            setup(ctx) { ctx.options.inputRaw = 'this is a test'; }
        },
        {
            code: '{argslength}',
            expected: '3',
            setup(ctx) { ctx.options.inputRaw = 'this "is a" test'; }
        }
    ]
});
