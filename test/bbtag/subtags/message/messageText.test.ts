import type { GetMessageContentFeature } from '@blargbot/bbtag/subtags';
import { MessageTextSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetMessagePropTestCases } from './_getMessagePropTest.js';

const features = new Mock<GetMessageContentFeature>({ id: 'features' });

await runSubtagTests({
    subtag: new MessageTextSubtag(features.instance),
    argCountBounds: { min: 0, max: 3 },
    names: ['messageText', 'text'],
    setup(ctx) {
        ctx.adoptMock(features);
    },
    cases: [
        ...createGetMessagePropTestCases({
            quiet: '',
            includeNoArgs: true,
            getProp: (c, i) => features.setup(m => m.getMessageContent(c, i)),
            notExists: Promise.resolve(undefined),
            queryOptions: noLookup => ({ noLookup }),
            generateCode(...args) {
                return `{${['messagetext', ...args].filter(a => a !== undefined).join(';')}}`;
            },
            cases: [
                {
                    expected: 'This is some message content',
                    setup(getProp) {
                        getProp.resolves('This is some message content').mustHappen(1);
                    }
                },
                {
                    expected: 'abcxyz',
                    setup(getProp) {
                        getProp.resolves('abcxyz').mustHappen(1);
                    }
                }
            ]
        })
    ]
});
