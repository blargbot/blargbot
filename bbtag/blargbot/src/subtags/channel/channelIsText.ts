import { booleanResultAdapter, Subtag } from '@bbtag/subtag';

import type { Channel } from '../../plugins/ChannelPlugin.js';
import { ChannelPlugin, ChannelType } from '../../plugins/ChannelPlugin.js';
import { p } from '../p.js';

export class ChannelIsTextSubtag extends Subtag {
    public constructor() {
        super({
            name: 'channelIsText',
            aliases: ['isText']
        });
    }

    @Subtag.signature({ id: 'current' })
        .parameter(p.plugin(ChannelPlugin).map(c => c.current))
        .convertResultUsing(booleanResultAdapter)
    @Subtag.signature({ id: 'channel' })
        .parameter(p.channel({ quietMode: 'arg' }))
        .convertResultUsing(booleanResultAdapter)
    public isText(channel: Channel): boolean {
        return textChannels.has(channel.type);
    }
}

export const textChannels = new Set([
    ChannelType.DM,
    ChannelType.GROUP_DM,
    ChannelType.NEWS,
    ChannelType.THREAD_NEWS,
    ChannelType.THREAD_PRIVATE,
    ChannelType.THREAD_PUBLIC,
    ChannelType.TEXT,
    ChannelType.VOICE
] as const);
