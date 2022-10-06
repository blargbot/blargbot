import { MessageReplySubtag } from '@blargbot/bbtag/subtags/message/messagereply';

import { runSubtagTests } from '../SubtagTestSuite';
import { createGetMessagePropTestCases } from './_getMessagePropTest';

runSubtagTests({
    subtag: new MessageReplySubtag(),
    argCountBounds: { min: 0, max: 3 },
    cases: [
        ...createGetMessagePropTestCases({
            quiet: ``,
            includeNoArgs: true,
            generateCode(...args) {
                return `{${[`messagereply`, ...args].filter(a => a !== undefined).join(`;`)}}`;
            },
            cases: [{
                expected: `954074684058660934`,
                setup(channel, message) {
                    message.message_reference = {
                        message_id: `954074684058660934`,
                        channel_id: channel.id
                    };
                }
            }]
        })
    ]
});
