import { BBTagContext, Subtag } from '@cluster/bbtag';
import { SubtagType } from '@cluster/utils';
import { guard } from '@core/utils';

export class ChannelCategoriesSubtag extends Subtag {
    public constructor() {
        super({
            name: 'channelcategories',
            category: SubtagType.CHANNEL,
            desc: 'Returns an array of category IDs on the current guild.',
            aliases: ['categories'],
            definition: [
                {
                    parameters: [],
                    exampleCode: 'This guild has {length;{categories}} categories.',
                    exampleOut: 'This guild has 7 categories.',
                    returns: 'id[]',
                    execute: (ctx) => this.getChannelCategories(ctx)
                }
            ]
        });
    }

    public getChannelCategories(context: BBTagContext): string[] {
        return context.guild.channels.cache.filter(guard.isCategoryChannel).map(c => c.id);
    }
}
