import type { GuildChannelNsfwLocals } from '@blargbot/bbtag-engine';
import { replacers } from '@blargbot/bbtag-engine';

import { runSubtagTests } from '../../SubtagTestSuite.js';
import { createGetChannelPropTestCases } from './_getChannelPropTest.js';

await runSubtagTests({
    replacer: replacers.channelIsNsfwReplacer,
    names: ['channelIsNsfw', 'isNsfw'],
    argCountBounds: { min: 0, max: 2 },
    cases: [
        ...createGetChannelPropTestCases<GuildChannelNsfwLocals>({
            quiet: '',
            includeNoArgs: true,
            generateCode(...args) {
                return `{${['channelisnsfw', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: 'true',
                    setup(ctx, channelId) {
                        ctx.discord.setup(m => m.isChannelNsfw(channelId)).resolves(true).mustHappen(1);
                    }
                },
                {
                    expected: 'false',
                    setup(ctx, channelId) {
                        ctx.discord.setup(m => m.isChannelNsfw(channelId)).resolves(false).mustHappen(1);
                    }
                }
            ]
        })
    ]
});
