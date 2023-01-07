import { BBTagRuntimeError } from '@bbtag/engine';
import { numberResultAdapter, Subtag } from '@bbtag/subtag';

import type { Channel } from '../../plugins/ChannelPlugin.js';
import { ChannelPlugin } from '../../plugins/ChannelPlugin.js';
import { p } from '../p.js';

export class ChannelPositionSubtag extends Subtag {
    public constructor() {
        super({
            name: 'channelPosition',
            aliases: ['channelPos', 'categoryPosition', 'categoryPos']
        });
    }

    @Subtag.signature({ id: 'current' })
        .parameter(p.plugin(ChannelPlugin).map(c => c.current))
        .convertResultUsing(numberResultAdapter)
    @Subtag.signature({ id: 'channel' })
        .parameter(p.channel({ quietMode: 'arg' }))
        .convertResultUsing(numberResultAdapter)
    public getPosition(channel: Channel): number {
        if (channel.position === undefined)
            throw new BBTagRuntimeError('Threads dont have a position', `${channel.id} is a thread and doesnt have a position`);

        return channel.position;
    }
}
