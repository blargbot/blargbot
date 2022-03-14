import { ArgsLengthSubtag } from '@blargbot/cluster/subtags/simple/argslength';

import { runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new ArgsLengthSubtag(),
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
