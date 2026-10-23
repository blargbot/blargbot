import type { IsChannelNsfwThunk } from '@blargbot/bbtag/subtags';
import { ChannelIsNsfwSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetChannelPropTestCases } from './_getChannelPropTest.js';

const isChannelNsfw = new Mock<IsChannelNsfwThunk>({ id: 'isChannelNsfw', callable: true });

await runSubtagTests({
    subtag: new ChannelIsNsfwSubtag({
        isChannelNsfw: isChannelNsfw.instance
    }),
    argCountBounds: { min: 0, max: 2 },
    names: ['channelIsNsfw', 'isNsfw'],
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
                        isChannelNsfw.setup(m => m(ctx.guild.id, channelId)).resolves(true).mustHappen(1);
                    }
                },
                {
                    expected: 'false',
                    setup(channelId, ctx) {
                        isChannelNsfw.setup(m => m(ctx.guild.id, channelId)).resolves(false).mustHappen(1);
                    }
                },
                {
                    expected: 'false',
                    setup(channelId, ctx) {
                        isChannelNsfw.setup(m => m(ctx.guild.id, channelId)).resolves(undefined).mustHappen(1);
                    }
                }
            ]
        })
    ]
});
