import { BBTagRuntimeError } from '@bbtag/engine';
import { emptyResultAdapter, Subtag } from '@bbtag/subtag';

import type { Channel } from '../../plugins/ChannelPlugin.js';
import { ChannelPlugin } from '../../plugins/ChannelPlugin.js';
import { p } from '../p.js';

export class SlowModeSubtag extends Subtag {
    public constructor() {
        super({
            name: 'slowMode'
        });
    }

    @Subtag.signature({ id: 'setChannel' })
        .parameter(p.plugin(ChannelPlugin))
        .parameter(p.channel({ quietMode: true }))
        .parameter(p.int('time').optional(0))
        .convertResultUsing(emptyResultAdapter)
    @Subtag.signature({ id: 'setCurrent' })
        .parameter(p.plugin(ChannelPlugin))
        .parameter(p.plugin(ChannelPlugin).map(c => c.current))
        .parameter(p.int('time', { ifInvalidUse: 0 }).optional(0))
        .convertResultUsing(emptyResultAdapter)
    public async setSlowmode(
        channels: ChannelPlugin,
        channel: Channel,
        timeout: number
    ): Promise<void> {
        timeout = Math.min(timeout, 21600);

        const result = await channels.edit(channel.id, { rateLimitPerUser: timeout });
        if (typeof result === 'string')
            throw new BBTagRuntimeError('Missing required permissions', result);
    }
}
