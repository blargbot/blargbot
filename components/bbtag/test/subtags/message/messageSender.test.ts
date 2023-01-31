import { Subtag } from '@blargbot/bbtag';
import { MessageSenderSubtag } from '@blargbot/bbtag/subtags';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetMessagePropTestCases } from './_getMessagePropTest.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(MessageSenderSubtag),
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
