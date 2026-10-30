import type { ListChannelsFeature } from '@blargbot/bbtag-engine/subtags';
import { ChannelsSubtag } from '@blargbot/bbtag-engine/subtags';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetChannelPropTestCases } from './_getChannelPropTest.js';

const features = new Mock<ListChannelsFeature>({ id: 'features' });

await runSubtagTests({
    subtag: new ChannelsSubtag(features.instance),
    argCountBounds: { min: 0, max: 2 },
    names: ['channels'],
    setup(ctx) {
        ctx.adoptMock(features);
    },
    cases: [
        ...createGetChannelPropTestCases({
            quiet: '',
            includeNoArgs: false,
            generateCode(...args) {
                return `{${['channels', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: '[]',
                    setup(channelId, ctx) {
                        features.setup(m => m.listChannels(ctx.guildId, channelId)).resolves([]).mustHappen(1);
                    }
                },
                {
                    expected: '["2398462398472","23098475928447"]',
                    setup(channelId, ctx) {
                        features.setup(m => m.listChannels(ctx.guildId, channelId)).resolves(['2398462398472', '23098475928447']).mustHappen(1);
                    }
                }
            ]
        }),
        {
            code: '{channels}',
            expected: '["23489762384769837","342789565384956435"]',
            setup(ctx) {
                features.setup(m => m.listChannels(ctx.guildId)).resolves(['23489762384769837', '342789565384956435']).mustHappen(1);
            }
        }
    ]
});
