import { MessageTimeSubtag } from '@blargbot/cluster/subtags/message/messagetime';

import { runSubtagTests } from '../SubtagTestSuite';
import { createGetMessagePropTestCases } from './_getMessagePropTest';

runSubtagTests({
    subtag: new MessageTimeSubtag(),
    argCountBounds: { min: 0, max: 3 },
    cases: [
        ...createGetMessagePropTestCases({
            quiet: false,
            includeNoArgs: true,
            generateCode(...args) {
                return `{${['messagetime', ...args].filter(a => a !== undefined).join(';')}}`;
            },
            cases: [
                {
                    expected: '1609459200000',
                    setup(_, message) {
                        message.timestamp = '2021-01-01T00:00:00+0000';
                    }
                }
            ]
        }),
        ...createGetMessagePropTestCases({
            quiet: false,
            includeNoArgs: true,
            generateCode(...args) {
                return `{${['messagetime', ...args, 'DD/MM/YYYY'].filter(a => a !== undefined).join(';')}}`;
            },
            cases: [
                {
                    expected: '01/01/2021',
                    setup(_, message) {
                        message.timestamp = '2021-01-01T00:00:00+0000';
                    }
                }
            ]
        })
    ]
});
