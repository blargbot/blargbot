import { Subtag } from '@blargbot/bbtag';
import { MessageTextSubtag } from '@blargbot/bbtag/subtags/message/messageText.js';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetMessagePropTestCases } from './_getMessagePropTest.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(MessageTextSubtag),
    argCountBounds: { min: 0, max: 3 },
    cases: [
        ...createGetMessagePropTestCases({
            quiet: '',
            includeNoArgs: true,
            generateCode(...args) {
                return `{${['messagetext', ...args].filter(a => a !== undefined).join(';')}}`;
            },
            cases: [
                {
                    expected: 'This is some message content',
                    setup(_, message) {
                        message.content = 'This is some message content';
                    }
                },
                {
                    expected: 'abcxyz',
                    setup(_, message) {
                        message.content = 'abcxyz';
                    }
                }
            ]
        })
    ]
});
