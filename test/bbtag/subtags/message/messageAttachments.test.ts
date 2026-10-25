import type { GetMessageAttachmentUrlsThunk } from '@blargbot/bbtag/subtags';
import { ChannelIdSubtag, MessageAttachmentsSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetMessagePropTestCases } from './_getMessagePropTest.js';

const getMessageAttachmentUrls = new Mock<GetMessageAttachmentUrlsThunk>({ id: 'getMessageAttachmentUrls', callable: true });
const channelIdSubtag = new Mock<ChannelIdSubtag>({ id: 'ChannelIdSubtag' });

await runSubtagTests({
    subtag: new MessageAttachmentsSubtag({
        getMessageAttachmentUrls: getMessageAttachmentUrls.instance
    }),
    argCountBounds: { min: 0, max: 3 },
    names: ['messageAttachments', 'attachments'],
    otherSubtags: [channelIdSubtag.instance],
    setup(ctx) {
        ctx.adoptSubtagMock(channelIdSubtag, { type: ChannelIdSubtag });
    },
    cases: [
        ...createGetMessagePropTestCases({
            quiet: '[]',
            includeNoArgs: true,
            getProp: (c, i) => getMessageAttachmentUrls.setup(m => m(c, i)),
            notExists: Promise.resolve(undefined),
            queryOptions: noLookup => ({ noLookup }),
            generateCode(...args) {
                return `{${['messageattachments', ...args].filter(a => a !== undefined).join(';')}}`;
            },
            cases: [
                {
                    title: 'No attachments',
                    expected: '[]',
                    setup(getProp) {
                        getProp.resolves([]).mustHappen(1);
                    }
                },
                {
                    title: '1 attachment',
                    expected: '["https://www.google.com/url"]',
                    setup(getProp) {
                        getProp.resolves([
                            new URL('https://www.google.com/url')
                        ]).mustHappen(1);
                    }
                },
                {
                    title: '2 attachments',
                    expected: '["https://www.google.com/url","https://www.google.com/url2"]',
                    setup(getProp) {
                        getProp.resolves([
                            new URL('https://www.google.com/url'),
                            new URL('https://www.google.com/url2')
                        ]).mustHappen(1);
                    }
                }
            ]
        })
    ]
});
