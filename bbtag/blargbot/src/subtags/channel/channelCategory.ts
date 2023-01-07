import { BBTagRuntimeError } from '@bbtag/engine';
import { Subtag } from '@bbtag/subtag';

import type { Channel } from '../../plugins/ChannelPlugin.js';
import { ChannelPlugin } from '../../plugins/ChannelPlugin.js';
import { p } from '../p.js';

export class ChannelCategorySubtag extends Subtag {
    public constructor() {
        super({
            name: 'channelCategory',
            aliases: ['category']
        });
    }

    @Subtag.signature({ id: 'current' })
        .parameter(p.plugin(ChannelPlugin).map(c => c.current))
    @Subtag.signature({ id: 'channel' })
        .parameter(p.channel({ quietMode: 'arg' }))
    public getCategory(channel: Channel): string {
        if (typeof channel.category !== 'string')
            throw new BBTagRuntimeError('Channel has no parent')
                .withDisplay('');

        return channel.category;
    }
}
