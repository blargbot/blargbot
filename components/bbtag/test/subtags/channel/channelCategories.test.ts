import { Subtag } from '@bbtag/blargbot';
import { ChannelCategoriesSubtag } from '@bbtag/blargbot/subtags';
import Discord from 'discord-api-types/v10';

import { runSubtagTests, SubtagTestContext } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(ChannelCategoriesSubtag),
    argCountBounds: { min: 0, max: 0 },
    cases: [
        {
            code: '{channelcategories}',
            expected: '[]',
            postSetup(bbctx, ctx) {
                ctx.channelService.setup(m => m.getAll(bbctx)).thenResolve(Object.values(ctx.channels));
            }
        },

        {
            code: '{channelcategories}',
            expected: '["29346782894762","2938476297493274"]',
            setup(ctx) {
                ctx.channels.abc = SubtagTestContext.createChannel({
                    id: '29346782894762',
                    type: Discord.ChannelType.GuildCategory
                });
                ctx.channels.def = SubtagTestContext.createChannel({
                    id: '2938476297493274',
                    type: Discord.ChannelType.GuildCategory
                });
            },
            postSetup(bbctx, ctx) {
                ctx.channelService.setup(m => m.getAll(bbctx)).thenResolve(Object.values(ctx.channels));
            }
        }
    ]
});
