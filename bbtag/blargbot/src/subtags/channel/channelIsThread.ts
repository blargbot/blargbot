import { booleanResultAdapter, Subtag } from '@bbtag/subtag';

import type { Channel } from '../../plugins/ChannelPlugin.js';
import { ChannelPlugin, ChannelType } from '../../plugins/ChannelPlugin.js';
import { p } from '../p.js';

export class ChannelIsThreadSubtag extends Subtag {
    public constructor() {
        super({
            name: 'channelIsThread',
            aliases: ['isThread']
        });
    }

    @Subtag.signature({ id: 'current' })
        .parameter(p.plugin(ChannelPlugin).map(c => c.current))
        .convertResultUsing(booleanResultAdapter)
    @Subtag.signature({ id: 'channel' })
        .parameter(p.channel({ quietMode: 'arg' }))
        .convertResultUsing(booleanResultAdapter)
    public isThread(channel: Channel): boolean {
        return threadChannels.has(channel.type);
    }
}

export const threadChannels = new Set([
    ChannelType.THREAD_NEWS,
    ChannelType.THREAD_PRIVATE,
    ChannelType.THREAD_PUBLIC
] as const);
