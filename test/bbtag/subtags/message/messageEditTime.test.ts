import type { GetMessageEditTimestampFeature } from '@blargbot/bbtag/subtags';
import { MessageEditTimeSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetMessagePropTestCases } from './_getMessagePropTest.js';

const features = new Mock<GetMessageEditTimestampFeature>({ id: 'features' });

const now = Temporal.Instant.from('2026-09-22T22:20:00Z');
await runSubtagTests({
    subtag: new MessageEditTimeSubtag(features.instance),
    argCountBounds: { min: 0, max: 3 },
    names: ['messageEditTime'],
    setup(ctx, _code, test) {
        ctx.adoptMock(features);
        test.mock.method(Temporal.Now, 'instant', () => now);
    },
    cases: [
        ...createGetMessagePropTestCases({
            quiet: false,
            includeNoArgs: true,
            emptyIsCurrentMessage: false,
            getProp: (c, i) => features.setup(m => m.getMessageEditTimestamp(c, i)),
            notExists: Promise.resolve(undefined),
            queryOptions: () => ({ noLookup: true }),
            generateCode(...args) {
                return `{${['messageedittime', ...args].filter(a => a !== undefined).join(';')}}`;
            },
            cases: [
                {
                    title: 'Not edited',
                    expected: '1790115600000',
                    setup(getProp) {
                        getProp.resolves(null).mustHappen(1);
                    }
                },
                {
                    title: 'Has been edited',
                    expected: '1609459200000',
                    setup(getProp) {
                        getProp.resolves(Temporal.Instant.from('2021-01-01T00:00:00+0000')).mustHappen(1);
                    }
                }
            ]
        }),
        ...createGetMessagePropTestCases({
            quiet: false,
            includeNoArgs: true,
            emptyIsCurrentMessage: false,
            getProp: (c, i) => features.setup(m => m.getMessageEditTimestamp(c, i)),
            notExists: Promise.resolve(undefined),
            queryOptions: () => ({ noLookup: true }),
            generateCode(...args) {
                return `{${['messageedittime', ...args, 'DD/MM/YYYY'].filter(a => a !== undefined).join(';')}}`;
            },
            cases: [
                {
                    title: 'Not edited',
                    expected: '22/09/2026',
                    setup(getProp) {
                        getProp.resolves(null).mustHappen(1);
                    }
                },
                {
                    title: 'Has been edited',
                    expected: '01/01/2021',
                    setup(getProp) {
                        getProp.resolves(Temporal.Instant.from('2021-01-01T00:00:00+0000')).mustHappen(1);
                    }
                }
            ]
        })
    ]
});
