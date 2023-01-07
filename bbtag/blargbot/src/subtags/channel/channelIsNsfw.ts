import { booleanResultAdapter, Subtag } from '@bbtag/subtag';

import type { Channel } from '../../plugins/ChannelPlugin.js';
import { ChannelPlugin } from '../../plugins/ChannelPlugin.js';
import { p } from '../p.js';

export class ChannelIsNsfwSubtag extends Subtag {
    public constructor() {
        super({
            name: 'channelIsNsfw',
            aliases: ['isNsfw']
        });
    }

    @Subtag.signature({ id: 'current' })
        .parameter(p.plugin(ChannelPlugin).map(c => c.current))
        .convertResultUsing(booleanResultAdapter)
    @Subtag.signature({ id: 'channel' })
        .parameter(p.channel({ quietMode: 'arg' }))
        .convertResultUsing(booleanResultAdapter)
    public isNsfw(channel: Channel): boolean {
        return channel.nsfw;
    }
}
