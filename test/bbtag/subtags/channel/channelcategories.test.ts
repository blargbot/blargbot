import { ChannelCategoriesSubtag } from '@blargbot/bbtag/subtags/channel/channelcategories';
import { ChannelType } from 'discord-api-types';

import { runSubtagTests, SubtagTestContext } from '../SubtagTestSuite';

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
                ctx.guild.channels.push(
                    SubtagTestContext.createApiChannel({
                        id: '29346782894762',
                        type: ChannelType.GuildCategory
                    }),
                    SubtagTestContext.createApiChannel({
                        id: '2938476297493274',
                        type: ChannelType.GuildCategory
                    })
                );
            }
        }
    ]
});
