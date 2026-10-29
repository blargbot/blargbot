import { BBTagRuntimeError } from '@blargbot/bbtag';
import type { GetLastMessageIdFeature } from '@blargbot/bbtag/subtags';
import { ChannelIsTextSubtag, LastMessageIdSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';

import { createMockSubtag, runSubtagTests } from '../SubtagTestSuite.js';
import { createGetChannelPropTestCases } from './_getChannelPropTest.js';

const features = new Mock<GetLastMessageIdFeature>({ id: 'features' });
const channelIsTextSubtag = createMockSubtag(ChannelIsTextSubtag);

await runSubtagTests({
    subtag: new LastMessageIdSubtag(features.instance),
    otherSubtags: [channelIsTextSubtag.instance],
    argCountBounds: { min: 0, max: 1 },
    names: ['lastMessageId'],
    setup(ctx) {
        ctx.adoptMock(features);
        ctx.adoptMock(channelIsTextSubtag);
    },
    cases: [
        ...createGetChannelPropTestCases({
            quiet: false,
            includeNoArgs: true,
            generateCode(...args) {
                return `{${['lastmessageid', ...args].join(';')}}`;
            },
            cases: [
                {
                    title: 'When a message has been sent',
                    expected: '2349786234946724',
                    setup(channelId, ctx) {
                        channelIsTextSubtag.setup(m => m.check(ctx.bbtag, channelId)).resolves(true).mustHappen(1);
                        features.setup(m => m.getLastMessageId(ctx.guildId, channelId)).resolves('2349786234946724').mustHappen(1);
                    }
                },
                {
                    title: 'When no message has been sent',
                    expected: '',
                    setup(channelId, ctx) {
                        channelIsTextSubtag.setup(m => m.check(ctx.bbtag, channelId)).resolves(true).mustHappen(1);
                        features.setup(m => m.getLastMessageId(ctx.guildId, channelId)).resolves(undefined).mustHappen(1);
                    }
                },
                {
                    title: 'When the channel is not textable',
                    expected: '`Channel must be a textable channel`',
                    error: new BBTagRuntimeError('Channel must be a textable channel'),
                    setup(channelId, ctx) {
                        channelIsTextSubtag.setup(m => m.check(ctx.bbtag, channelId)).resolves(false).mustHappen(1);
                    }
                }
            ]
        })
    ]
});
