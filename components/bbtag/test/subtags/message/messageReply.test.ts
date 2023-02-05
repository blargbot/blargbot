import { Subtag } from '@bbtag/blargbot';
import { MessageReplySubtag } from '@bbtag/blargbot/subtags';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetMessagePropTestCases } from './_getMessagePropTest.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(MessageReplySubtag),
    argCountBounds: { min: 0, max: 3 },
    cases: [
        ...createGetMessagePropTestCases({
            quiet: '',
            includeNoArgs: true,
            generateCode(...args) {
                return `{${['messagereply', ...args].filter(a => a !== undefined).join(';')}}`;
            },
            cases: [{
                expected: '954074684058660934',
                setup(channel, message) {
                    message.message_reference = {
                        message_id: '954074684058660934',
                        channel_id: channel.id
                    };
                }
            }]
        })
    ]
});
