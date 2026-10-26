import { BBTagRuntimeError } from '@blargbot/bbtag';
import type { GetLastMessageIdFeature } from '@blargbot/bbtag/subtags';
import { ChannelIsTextSubtag, LastMessageIdSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetChannelPropTestCases } from './_getChannelPropTest.js';

const features = new Mock<GetLastMessageIdFeature>({ id: 'features' });
const channelIsTextSubtag = new Mock<ChannelIsTextSubtag>({ id: 'channelIsTextSubtag' });

await runSubtagTests({
    subtag: new LastMessageIdSubtag(features.instance),
    otherSubtags: [channelIsTextSubtag.instance],
    argCountBounds: { min: 0, max: 1 },
    names: ['lastMessageId'],
    setup(ctx) {
        ctx.adoptMock(features);
        ctx.adoptSubtagMock(channelIsTextSubtag, { type: ChannelIsTextSubtag });
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
                    postSetup(channelId, bbctx, ctx) {
                        channelIsTextSubtag.setup(m => m.check(bbctx, channelId)).resolves(true).mustHappen(1);
                        features.setup(m => m.getLastMessageId(ctx.guild.id, channelId)).resolves('2349786234946724').mustHappen(1);
                    }
                },
                {
                    title: 'When no message has been sent',
                    expected: '',
                    postSetup(channelId, bbctx, ctx) {
                        channelIsTextSubtag.setup(m => m.check(bbctx, channelId)).resolves(true).mustHappen(1);
                        features.setup(m => m.getLastMessageId(ctx.guild.id, channelId)).resolves(undefined).mustHappen(1);
                    }
                },
                {
                    title: 'When the channel is not textable',
                    expected: '`Channel must be a textable channel`',
                    error: new BBTagRuntimeError('Channel must be a textable channel'),
                    postSetup(channelId, bbctx) {
                        channelIsTextSubtag.setup(m => m.check(bbctx, channelId)).resolves(false).mustHappen(1);
                    }
                }
            ]
        })
    ]
});
