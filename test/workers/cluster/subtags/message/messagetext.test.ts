import { MessageTextSubtag } from '@cluster/subtags/message/messagetext';

import { runSubtagTests } from '../SubtagTestSuite';
import { createGetMessagePropTestCases } from './_getMessagePropTest';

runSubtagTests({
    subtag: new MessageTextSubtag(),
    argCountBounds: { min: 0, max: 3 },
    cases: [
        ...createGetMessagePropTestCases({
            quiet: '',
            includeNoMessageId: true,
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
