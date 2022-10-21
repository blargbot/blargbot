import { guard } from '@blargbot/core/utils';

import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import templates from '../../text';
import { SubtagType } from '../../utils';

const tag = templates.subtags.channelcategories;

export class ChannelCategoriesSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'channelcategories',
            category: SubtagType.CHANNEL,
            aliases: ['categories'],
            definition: [
                {
                    parameters: [],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
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
