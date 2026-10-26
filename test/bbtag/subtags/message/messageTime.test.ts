import type { GetMessageTimestampFeature } from '@blargbot/bbtag/subtags';
import { MessageTimeSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetMessagePropTestCases } from './_getMessagePropTest.js';

const features = new Mock<GetMessageTimestampFeature>({ id: 'features' });

await runSubtagTests({
    subtag: new MessageTimeSubtag(features.instance),
    argCountBounds: { min: 0, max: 3 },
    names: ['messageTime', 'timestamp'],
    setup(ctx) {
        ctx.adoptMock(features);
    },
    cases: [
        ...createGetMessagePropTestCases({
            quiet: false,
            includeNoArgs: true,
            emptyIsCurrentMessage: false,
            getProp: (c, i) => features.setup(m => m.getMessageTimestamp(c, i)),
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
            getProp: (c, i) => features.setup(m => m.getMessageTimestamp(c, i)),
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
