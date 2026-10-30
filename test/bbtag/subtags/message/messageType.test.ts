import { MessageType } from '@blargbot/bbtag-engine';
import type { GetMessageTypeFeature } from '@blargbot/bbtag-engine/subtags';
import { MessageTypeSubtag } from '@blargbot/bbtag-engine/subtags';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';
import type { GetMessagePropTestCase } from './_getMessagePropTest.js';
import { createGetMessagePropTestCases } from './_getMessagePropTest.js';

const features = new Mock<GetMessageTypeFeature>({ id: 'features' });

await runSubtagTests({
    subtag: new MessageTypeSubtag(features.instance),
    argCountBounds: { min: 0, max: 2 },
    names: ['messageType'],
    setup(ctx) {
        ctx.adoptMock(features);
    },
    cases: [
        ...createGetMessagePropTestCases({
            quiet: false,
            includeNoArgs: true,
            getProp: (c, i) => features.setup(m => m.getMessageType(c, i)),
            notExists: Promise.resolve(undefined),
            queryOptions: () => undefined,
            generateCode(...args) {
                return `{${['messagetype', ...args].filter(a => a !== undefined).join(';')}}`;
            },
            cases: Object.entries(MessageType).map<GetMessagePropTestCase<Promise<number | undefined>>>(([key, value]) => ({
                title: `When the message is of type ${key}`,
                expected: value.toString(),
                setup(getProp) {
                    getProp.resolves(value).mustHappen(1);
                }
            }))
        })
    ]
});
