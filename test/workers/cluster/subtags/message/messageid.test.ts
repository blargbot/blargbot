import { TooManyArgumentsError } from '@cluster/bbtag/errors';
import { MessageIdSubtag } from '@cluster/subtags/message/messageid';

import { MarkerError, runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new MessageIdSubtag(),
    cases: [
        {
            code: '{messageid}',
            expected: '098765432212345678',
            setup(ctx) {
                ctx.message.id = '098765432212345678';
            }
        },
        {
            code: '{messageid;{eval}}',
            expected: '`Too many arguments`',
            errors: [
                { start: 11, end: 17, error: new MarkerError('eval', 11) },
                { start: 0, end: 18, error: new TooManyArgumentsError(0, 1) }
            ]
        }
    ]
});
