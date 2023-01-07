import { Subtag } from '@bbtag/subtag';

import type { Channel } from '../../plugins/ChannelPlugin.js';
import { ChannelPlugin } from '../../plugins/ChannelPlugin.js';
import { p } from '../p.js';

export class ChannelIdSubtag extends Subtag {

    public constructor() {
        super({
            name: 'channelId',
            aliases: ['categoryId']
        });
    }

    @Subtag.signature({ id: 'current' })
        .parameter(p.plugin(ChannelPlugin).map(c => c.current))
    @Subtag.signature({ id: 'channel' })
        .parameter(p.channel({ quietMode: 'arg' }))
    public getId(channel: Channel): string {
        return channel.id;
    }
}
