import type { IsChannelNsfwFeature } from '@blargbot/bbtag/subtags';
import { ChannelIsNsfwSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetChannelPropTestCases } from './_getChannelPropTest.js';

const features = new Mock<IsChannelNsfwFeature>({ id: 'features' });

await runSubtagTests({
    subtag: new ChannelIsNsfwSubtag(features.instance),
    argCountBounds: { min: 0, max: 2 },
    names: ['channelIsNsfw', 'isNsfw'],
    setup(ctx) {
        ctx.adoptMock(features);
    },
    cases: [
        ...createGetChannelPropTestCases({
            quiet: '',
            includeNoArgs: true,
            generateCode(...args) {
                return `{${['channelisnsfw', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: 'true',
                    setup(channelId, ctx) {
                        features.setup(m => m.isChannelNsfw(ctx.guildId, channelId)).resolves(true).mustHappen(1);
                    }
                },
                {
                    expected: 'false',
                    setup(channelId, ctx) {
                        features.setup(m => m.isChannelNsfw(ctx.guildId, channelId)).resolves(false).mustHappen(1);
                    }
                },
                {
                    expected: 'false',
                    setup(channelId, ctx) {
                        features.setup(m => m.isChannelNsfw(ctx.guildId, channelId)).resolves(undefined).mustHappen(1);
                    }
                }
            ]
        })
    ]
});
