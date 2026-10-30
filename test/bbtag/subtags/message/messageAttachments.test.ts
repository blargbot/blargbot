import type { GetMessageAttachmentUrlsFeature } from '@blargbot/bbtag-engine/subtags';
import { ChannelIdSubtag, MessageAttachmentsSubtag } from '@blargbot/bbtag-engine/subtags';
import { Mock } from '@blargbot/test-util';

import { createMockSubtag, runSubtagTests } from '../SubtagTestSuite.js';
import { createGetMessagePropTestCases } from './_getMessagePropTest.js';

const features = new Mock<GetMessageAttachmentUrlsFeature>({ id: 'features' });
const channelIdSubtag = createMockSubtag(ChannelIdSubtag);

await runSubtagTests({
    subtag: new MessageAttachmentsSubtag(features.instance),
    argCountBounds: { min: 0, max: 3 },
    names: ['messageAttachments', 'attachments'],
    otherSubtags: [channelIdSubtag.instance],
    setup(ctx) {
        ctx.adoptMock(features);
        ctx.adoptMock(channelIdSubtag);
    },
    cases: [
        ...createGetMessagePropTestCases({
            quiet: '[]',
            includeNoArgs: true,
            getProp: (c, i) => features.setup(m => m.getMessageAttachmentUrls(c, i)),
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
