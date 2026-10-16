import { MessageEditTimeSubtag } from '@blargbot/bbtag/subtags';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetMessagePropTestCases } from './_getMessagePropTest.js';

const now = Temporal.Instant.from('2026-09-22T22:20:00Z');
await runSubtagTests({
    subtag: new MessageEditTimeSubtag(),
    argCountBounds: { min: 0, max: 3 },
    names: ['messageEditTime'],
    setup(_, __, test) {
        test.mock.timers.enable({
            apis: ['Date'],
            now: new Date(now.epochMilliseconds)
        });
    },
    cases: [
        ...createGetMessagePropTestCases({
            quiet: false,
            includeNoArgs: true,
            generateCode(...args) {
                return `{${['messageedittime', ...args].filter(a => a !== undefined).join(';')}}`;
            },
            cases: [
                {
                    title: 'Not edited',
                    expected: '1790115600000',
                    setup(_, message) {
                        message.edited_timestamp = null;
                    }
                },
                {
                    title: 'Has been edited',
                    expected: '1609459200000',
                    setup(_, message) {
                        message.edited_timestamp = '2021-01-01T00:00:00+0000';
                    }
                }
            ]
        }),
        ...createGetMessagePropTestCases({
            quiet: false,
            includeNoArgs: true,
            generateCode(...args) {
                return `{${['messageedittime', ...args, 'DD/MM/YYYY'].filter(a => a !== undefined).join(';')}}`;
            },
            cases: [
                {
                    title: 'Not edited',
                    expected: '22/09/2026',
                    setup(_, message) {
                        message.edited_timestamp = null;
                    }
                },
                {
                    title: 'Has been edited',
                    expected: '01/01/2021',
                    setup(_, message) {
                        message.edited_timestamp = '2021-01-01T00:00:00+0000';
                    }
                }
            ]
        })
    ]
});
