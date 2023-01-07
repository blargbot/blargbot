import { booleanResultAdapter, Subtag } from '@bbtag/subtag';

import type { Channel } from '../../plugins/ChannelPlugin.js';
import { ChannelType } from '../../plugins/ChannelPlugin.js';
import { p } from '../p.js';

export class ChannelIsCategorySubtag extends Subtag {
    public constructor() {
        super({
            name: 'channelIsCategory',
            aliases: ['isCategory']
        });
    }

    @Subtag.signature({ id: 'channel' })
        .parameter(p.channel({ quietMode: 'arg' }))
        .convertResultUsing(booleanResultAdapter)
    public isCategory(channel: Channel): boolean {
        return channel.type === ChannelType.CATEGORY;
    }
}
