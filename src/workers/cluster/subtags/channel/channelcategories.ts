import { BaseSubtag } from '@cluster/bbtag';
import { SubtagType } from '@cluster/utils';
import { guard } from '@core/utils';

export class ChannelCategoriesSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'channelcategories',
            category: SubtagType.API,
            desc: 'Returns an array of category IDs on the current guild.',
            definition: [
                {
                    parameters: [],
                    exampleCode: 'This guild has {length;{categories}} categories.',
                    exampleOut: 'This guild has 7 categories.',
                    execute: (ctx) => JSON.stringify(ctx.guild.channels.cache.filter(guard.isCategoryChannel).map(c => c.id))
                }
            ]
        });
    }
}
