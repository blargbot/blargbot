import { arrayResultAdapter, Subtag } from '@bbtag/subtag';

import { ChannelPlugin } from '../../plugins/ChannelPlugin.js';
import { p } from '../p.js';

export class ChannelCategoriesSubtag extends Subtag {
    public constructor() {
        super({
            name: 'channelCategories',
            aliases: ['categories']
        });
    }

    @Subtag.signature({ id: 'default' })
        .parameter(p.plugin(ChannelPlugin))
        .convertResultUsing(arrayResultAdapter)
    public async getChannelCategories(channel: ChannelPlugin): Promise<string[]> {
        return await channel.getCategories();
    }
}
