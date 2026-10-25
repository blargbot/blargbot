import { MessageType } from '@blargbot/bbtag';
import type { GetMessageTypeThunk } from '@blargbot/bbtag/subtags';
import { MessageTypeSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';
import type { GetMessagePropTestCase } from './_getMessagePropTest.js';
import { createGetMessagePropTestCases } from './_getMessagePropTest.js';

const getMessageType = new Mock<GetMessageTypeThunk>({ id: 'getMessageType', callable: true });

await runSubtagTests({
    subtag: new MessageTypeSubtag({
        getMessageType: getMessageType.instance
    }),
    argCountBounds: { min: 0, max: 2 },
    names: ['messageType'],
    setup(ctx) {
        ctx.adoptMock(getMessageType);
    },
    cases: [
        ...createGetMessagePropTestCases({
            quiet: false,
            includeNoArgs: true,
            getProp: (c, i) => getMessageType.setup(m => m(c, i)),
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
