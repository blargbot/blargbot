import { guard } from '@blargbot/core/utils';

import { BBTagContext } from '../../BBTagContext';
import { DefinedSubtag } from '../../DefinedSubtag';
import { SubtagType } from '../../utils';

export class ChannelCategoriesSubtag extends DefinedSubtag {
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
        return context.guild.channels.filter(guard.isCategoryChannel).map(c => c.id);
    }
}
