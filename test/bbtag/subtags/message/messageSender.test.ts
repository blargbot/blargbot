import type { GetMessageAuthorThunk } from '@blargbot/bbtag/subtags';
import { MessageSenderSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetMessagePropTestCases } from './_getMessagePropTest.js';

const getMessageAuthor = new Mock<GetMessageAuthorThunk>({ id: 'getMessageAuthor', callable: true });

await runSubtagTests({
    subtag: new MessageSenderSubtag({
        getMessageAuthor: getMessageAuthor.instance
    }),
    argCountBounds: { min: 0, max: 3 },
    names: ['messageSender', 'sender'],
    setup(ctx) {
        ctx.adoptMock(getMessageAuthor);
    },
    cases: [
        ...createGetMessagePropTestCases({
            quiet: '',
            includeNoArgs: true,
            getProp: (c, i) => getMessageAuthor.setup(m => m(c, i)),
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
