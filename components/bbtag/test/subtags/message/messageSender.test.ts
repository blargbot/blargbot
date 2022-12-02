import { MessageSenderSubtag } from '@blargbot/bbtag/subtags/message/messageSender.js';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetMessagePropTestCases } from './_getMessagePropTest.js';

runSubtagTests({
    subtag: new MessageSenderSubtag(),
    argCountBounds: { min: 0, max: 3 },
    cases: [
        ...createGetMessagePropTestCases({
            quiet: '',
            includeNoArgs: true,
            generateCode(...args) {
                return `{${['messagesender', ...args].filter(a => a !== undefined).join(';')}}`;
            },
            cases: [
                {
                    expected: '09876554433211234567',
                    setup(_, message, ctx) {
                        message.author = ctx.users.other;
                        ctx.users.other.id = '09876554433211234567';
                    }
                }
            ]
        })
    ]
});
