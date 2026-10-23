import type { GetCategoryChannelsThunk } from '@blargbot/bbtag/subtags';
import { ChannelCategoriesSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';

const getCategoryChannels = new Mock<GetCategoryChannelsThunk>({ id: 'getCategoryChannels', callable: true });

await runSubtagTests({
    subtag: new ChannelCategoriesSubtag({
        getCategoryChannels: getCategoryChannels.instance
    }),
    argCountBounds: { min: 0, max: 0 },
    names: ['channelCategories', 'categories'],
    setup(ctx) {
        ctx.adoptMock(getCategoryChannels);
    },
    cases: [
        {
            code: '{channelcategories}',
            expected: '[]',
            setup(ctx) {
                getCategoryChannels.setup(m => m(ctx.guild.id)).resolves([]);
            }
        },
        {
            code: '{channelcategories}',
            expected: '["29346782894762","2938476297493274"]',
            setup(ctx) {
                getCategoryChannels.setup(m => m(ctx.guild.id)).resolves(['29346782894762', '2938476297493274']);
            }
        }
    ]
});
