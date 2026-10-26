import type { GetMessageAuthorFeature } from '@blargbot/bbtag/subtags';
import { MessageSenderSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetMessagePropTestCases } from './_getMessagePropTest.js';

const features = new Mock<GetMessageAuthorFeature>({ id: 'features' });

await runSubtagTests({
    subtag: new MessageSenderSubtag(features.instance),
    argCountBounds: { min: 0, max: 3 },
    names: ['messageSender', 'sender'],
    setup(ctx) {
        ctx.adoptMock(features);
    },
    cases: [
        ...createGetMessagePropTestCases({
            quiet: '',
            includeNoArgs: true,
            getProp: (c, i) => features.setup(m => m.getMessageAuthor(c, i)),
            notExists: Promise.resolve(undefined),
            queryOptions: noLookup => ({ noLookup }),
            generateCode(...args) {
                return `{${['messagesender', ...args].filter(a => a !== undefined).join(';')}}`;
            },
            cases: [
                {
                    expected: '09876554433211234567',
                    setup(getProp) {
                        getProp.resolves('09876554433211234567').mustHappen(1);
                    }
                }
            ]
        })
    ]
});
