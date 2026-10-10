import { ChannelType, replacers } from '@blargbot/bbtag-engine';

import { runSubtagTests } from '../../SubtagTestSuite.js';

await runSubtagTests({
    replacer: replacers.channelCategoriesReplacer,
    names: ['channelCategories', 'categories'],
    argCountBounds: { min: 0, max: 0 },
    cases: [
        {
            code: '{channelcategories}',
            expected: '[]',
            setup(ctx) {
                ctx.discord.setup(m => m.listChannels(ChannelType.GUILD_CATEGORY)).resolves([]).mustHappen(1);
            }
        },

        {
            code: '{channelcategories}',
            expected: '["29346782894762","2938476297493274"]',
            setup(ctx) {
                ctx.discord.setup(m => m.listChannels(ChannelType.GUILD_CATEGORY)).resolves([29346782894762n, 2938476297493274n]).mustHappen(1);
            }
        }
    ]
});
