import type { GetMessageContentThunk } from '@blargbot/bbtag/subtags';
import { MessageTextSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetMessagePropTestCases } from './_getMessagePropTest.js';

const getMessageContent = new Mock<GetMessageContentThunk>({ id: 'getMessageContent', callable: true });

await runSubtagTests({
    subtag: new MessageTextSubtag({
        getMessageContent: getMessageContent.instance
    }),
    argCountBounds: { min: 0, max: 3 },
    names: ['messageText', 'text'],
    setup(ctx) {
        ctx.adoptMock(getMessageContent);
    },
    cases: [
        ...createGetMessagePropTestCases({
            quiet: '',
            includeNoArgs: true,
            getProp: (c, i) => getMessageContent.setup(m => m(c, i)),
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
