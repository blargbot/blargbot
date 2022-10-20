import { guard } from '@blargbot/core/utils';

import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { SubtagType } from '../../utils';

export class ChannelCategoriesSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'channelcategories',
            category: SubtagType.CHANNEL,
            aliases: ['categories'],
            definition: [
                {
                    parameters: [],
                    description: 'Returns an array of category IDs on the current guild.',
                    exampleCode: 'This guild has {length;{categories}} categories.',
                    exampleOut: 'This guild has 7 categories.',
                    returns: 'id[]',
                    execute: (ctx) => this.getChannelCategories(ctx)
                }
            ]
        });
    }

    public getChannelCategories(context: BBTagContext): string[] {
        return context.guild.channels.filter(guard.isCategoryChannel).map(c => c.id);
    }
}
