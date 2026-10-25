import type { GetMessageReplyTargetThunk } from '@blargbot/bbtag/subtags';
import { MessageReplySubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetMessagePropTestCases } from './_getMessagePropTest.js';

const getMessageReplyTarget = new Mock<GetMessageReplyTargetThunk>({ id: 'getMessageReplyTarget', callable: true });

await runSubtagTests({
    subtag: new MessageReplySubtag({
        getMessageReplyTarget: getMessageReplyTarget.instance
    }),
    argCountBounds: { min: 0, max: 3 },
    names: ['messageReply'],
    setup(ctx) {
        ctx.adoptMock(getMessageReplyTarget);
    },
    cases: [
        ...createGetMessagePropTestCases({
            quiet: '',
            includeNoArgs: true,
            getProp: (c, i) => getMessageReplyTarget.setup(m => m(c, i)),
            notExists: Promise.resolve(undefined),
            queryOptions: noLookup => ({ noLookup }),
            generateCode(...args) {
                return `{${['messagereply', ...args].filter(a => a !== undefined).join(';')}}`;
            },
            cases: [
                {
                    expected: '954074684058660934',
                    setup(getProp) {
                        getProp.resolves('954074684058660934').mustHappen(1);
                    }
                },
                {
                    expected: '',
                    setup(getProp) {
                        getProp.resolves(null).mustHappen(1);
                    }
                }
            ]
        })
    ]
});
