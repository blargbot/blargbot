import { MessageIdSubtag } from '@blargbot/bbtag/subtags/message/messageid';

import { runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new MessageIdSubtag(),
    argCountBounds: { min: 0, max: 0 },
    cases: [
        {
            code: '{messageid}',
            expected: '098765432212345678',
            setup(ctx) {
                ctx.message.id = '098765432212345678';
            }
        }
    ]
});
