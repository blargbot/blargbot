import { Subtag } from '@blargbot/bbtag';
import { MessageIdSubtag } from '@blargbot/bbtag/subtags/message/messageId.js';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(MessageIdSubtag),
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
