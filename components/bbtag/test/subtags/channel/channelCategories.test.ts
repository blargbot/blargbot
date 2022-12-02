import { ChannelCategoriesSubtag } from '@blargbot/bbtag/subtags/channel/channelCategories.js';
import { ChannelType } from 'discord-api-types/v9';

import { runSubtagTests, SubtagTestContext } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: new ChannelCategoriesSubtag(),
    argCountBounds: { min: 0, max: 0 },
    cases: [
        {
            code: '{channelcategories}',
            expected: '[]'
        },

        {
            code: '{channelcategories}',
            expected: '["29346782894762","2938476297493274"]',
            setup(ctx) {
                ctx.channels.abc = SubtagTestContext.createApiChannel({
                    id: '29346782894762',
                    type: ChannelType.GuildCategory
                });
                ctx.channels.def = SubtagTestContext.createApiChannel({
                    id: '2938476297493274',
                    type: ChannelType.GuildCategory
                });
            }
        }
    ]
});
