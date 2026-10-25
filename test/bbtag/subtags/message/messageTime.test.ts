import type { GetMessageTimestampThunk } from '@blargbot/bbtag/subtags';
import { MessageTimeSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetMessagePropTestCases } from './_getMessagePropTest.js';

const getMessageTimestamp = new Mock<GetMessageTimestampThunk>({ id: 'getMessageTimestamp', callable: true });

await runSubtagTests({
    subtag: new MessageTimeSubtag({
        getMessageTimestamp: getMessageTimestamp.instance
    }),
    argCountBounds: { min: 0, max: 3 },
    names: ['messageTime', 'timestamp'],
    setup(ctx) {
        ctx.adoptMock(getMessageTimestamp);
    },
    cases: [
        ...createGetMessagePropTestCases({
            quiet: false,
            includeNoArgs: true,
            emptyIsCurrentMessage: false,
            getProp: (c, i) => getMessageTimestamp.setup(m => m(c, i)),
            notExists: Promise.resolve(undefined),
            queryOptions: () => ({ noLookup: true }),
            generateCode(...args) {
                return `{${['messagetime', ...args].filter(a => a !== undefined).join(';')}}`;
            },
            cases: [
                {
                    expected: '1609459200000',
                    setup(getProp) {
                        getProp.resolves(Temporal.Instant.from('2021-01-01T00:00:00+0000'));
                    }
                }
            ]
        }),
        ...createGetMessagePropTestCases({
            quiet: false,
            includeNoArgs: true,
            emptyIsCurrentMessage: false,
            getProp: (c, i) => getMessageTimestamp.setup(m => m(c, i)),
            notExists: Promise.resolve(undefined),
            queryOptions: () => ({ noLookup: true }),
            generateCode(...args) {
                return `{${['messagetime', ...args, 'DD/MM/YYYY'].filter(a => a !== undefined).join(';')}}`;
            },
            cases: [
                {
                    expected: '01/01/2021',
                    setup(getProp) {
                        getProp.resolves(Temporal.Instant.from('2021-01-01T00:00:00+0000'));
                    }
                }
            ]
        })
    ]
});
