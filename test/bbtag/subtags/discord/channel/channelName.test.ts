import type { GuildChannelNameLocals } from '@blargbot/bbtag-engine';
import { replacers } from '@blargbot/bbtag-engine';

import { runSubtagTests } from '../../SubtagTestSuite.js';
import { createGetChannelPropTestCases } from './_getChannelPropTest.js';

await runSubtagTests({
    replacer: replacers.channelNameReplacer,
    names: ['channelName', 'categoryName'],
    argCountBounds: { min: 0, max: 2 },
    cases: [
        ...createGetChannelPropTestCases<GuildChannelNameLocals>({
            quiet: '',
            includeNoArgs: true,
            generateCode(...args) {
                return `{${['channelname', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: 'my cool channel',
                    setup(ctx, channelId) {
                        ctx.discord.setup(m => m.getChannelName(channelId)).resolves('my cool channel');
                    }
                }
            ]
        })
    ]
});
