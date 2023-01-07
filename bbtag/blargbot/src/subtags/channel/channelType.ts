import { BBTagRuntimeError } from '@bbtag/engine';
import { Subtag } from '@bbtag/subtag';

import type { Channel, ChannelType } from '../../plugins/ChannelPlugin.js';
import { ChannelPlugin } from '../../plugins/ChannelPlugin.js';
import { p } from '../p.js';

export class ChannelTypeSubtag extends Subtag {
    public constructor() {
        super({
            name: 'channelType'
        });
    }

    @Subtag.signature({ id: 'current' })
        .parameter(p.plugin(ChannelPlugin).map(c => c.current))
    @Subtag.signature({ id: 'channel' })
        .parameter(p.channel({ quietMode: 'arg' }))
    public getType(channel: Channel): ChannelType {
        if (channel.position === undefined)
            throw new BBTagRuntimeError('Threads dont have a position', `${channel.id} is a thread and doesnt have a position`);

        return channel.type;
    }
}
