import { arrayResultAdapter, Subtag } from '@bbtag/subtag';

import type { Channel } from '../../plugins/ChannelPlugin.js';
import { ChannelPlugin } from '../../plugins/ChannelPlugin.js';
import { p } from '../p.js';

export class ChannelsSubtag extends Subtag {
    public constructor() {
        super({
            name: 'channels'
        });
    }

    @Subtag.signature({ id: 'current' })
        .parameter(p.plugin(ChannelPlugin))
        .convertResultUsing(arrayResultAdapter)
    public getChannels(channels: ChannelPlugin): string[] {
        return channels.all.map(c => c.id);
    }

    @Subtag.signature({ id: 'channel' })
        .parameter(p.plugin(ChannelPlugin))
        .parameter(p.channel({ quietMode: 'arg' }))
        .convertResultUsing(arrayResultAdapter)
    public getChannelsInCategory(channels: ChannelPlugin, channel: Channel): string[] {
        return channels.all
            .filter(c => c.category === channel.id)
            .map(c => c.id);
    }
}
