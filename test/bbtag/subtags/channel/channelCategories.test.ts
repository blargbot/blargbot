import type { GetCategoryChannelsFeature } from '@blargbot/bbtag/subtags';
import { ChannelCategoriesSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';

const features = new Mock<GetCategoryChannelsFeature>({ id: 'features' });

await runSubtagTests({
    subtag: new ChannelCategoriesSubtag(features.instance),
    argCountBounds: { min: 0, max: 0 },
    names: ['channelCategories', 'categories'],
    setup(ctx) {
        ctx.adoptMock(features);
    },
    cases: [
        {
            code: '{channelcategories}',
            expected: '[]',
            setup(ctx) {
                features.setup(m => m.getCategoryChannels(ctx.guild.id)).resolves([]);
            }
        },
        {
            code: '{channelcategories}',
            expected: '["29346782894762","2938476297493274"]',
            setup(ctx) {
                features.setup(m => m.getCategoryChannels(ctx.guild.id)).resolves(['29346782894762', '2938476297493274']);
            }
        }
    ]
});
