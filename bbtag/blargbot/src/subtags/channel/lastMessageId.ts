import { BBTagRuntimeError } from '@bbtag/engine';
import { optionalStringResultAdapter, Subtag } from '@bbtag/subtag';

import { ChannelNotFoundError } from '../../errors/ChannelNotFoundError.js';
import type { Channel } from '../../plugins/ChannelPlugin.js';
import { ChannelPlugin } from '../../plugins/ChannelPlugin.js';
import { p } from '../p.js';
import { textChannels } from './channelIsText.js';

export class LastMessageIdSubtag extends Subtag {
    public constructor() {
        super({
            name: 'lastMessageId'
        });
    }

    @Subtag.signature({ id: 'current' })
        .parameter(p.plugin(ChannelPlugin).map(c => c.current))
        .convertResultUsing(optionalStringResultAdapter(''))
    @Subtag.signature({ id: 'channel' })
        .parameter(p.channel({ quietMode: 'scope', notFound: query => new ChannelNotFoundError(query) }))
        .convertResultUsing(optionalStringResultAdapter(''))
    public getLastMessage(channel: Channel): string | undefined {
        if (!textChannels.has(channel.type))
            throw new BBTagRuntimeError('Channel must be a textable channel');
        return channel.lastMessageId;
    }
}
