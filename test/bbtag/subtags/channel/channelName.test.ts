import type { GetChannelNameFeature } from '@blargbot/bbtag/subtags';
import { ChannelNameSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetChannelPropTestCases } from './_getChannelPropTest.js';

const features = new Mock<GetChannelNameFeature>({ id: 'features' });

await runSubtagTests({
    subtag: new ChannelNameSubtag(features.instance),
    argCountBounds: { min: 0, max: 2 },
    names: ['channelName', 'categoryName'],
    setup(ctx) {
        ctx.adoptMock(features);
    },
    cases: [
        ...createGetChannelPropTestCases({
            quiet: '',
            includeNoArgs: true,
            generateCode(...args) {
                return `{${['channelname', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: 'my cool channel',
                    setup(channelId, ctx) {
                        features.setup(m => m.getChannelName(ctx.guild.id, channelId)).resolves('my cool channel').mustHappen(1);
                    }
                },
                {
                    expected: 'unknown',
                    setup(channelId, ctx) {
                        features.setup(m => m.getChannelName(ctx.guild.id, channelId)).resolves(undefined).mustHappen(1);
                    }
                }
            ]
        })
    ]
});
