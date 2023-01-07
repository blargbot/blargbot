import { BBTagRuntimeError } from '@bbtag/engine';
import { Subtag } from '@bbtag/subtag';

import { ChannelNotFoundError } from '../../errors/ChannelNotFoundError.js';
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
        .parameter(p.plugin(ChannelPlugin).map(c => c.currentChannel))
    @Subtag.signature({ id: 'channel' })
        .parameter(p.group(p.string('channel'), p.quiet)
            .transform(async function* ([channel, quiet], script) {
                const channels = script.process.plugins.get(ChannelPlugin);
                const result = await channels.query(channel, { noLookup: quiet });
                if (result !== undefined)
                    return result;
                throw new ChannelNotFoundError(channel)
                    .withDisplay(quiet ? '' : undefined);
            }))
    public getCategory(channel: Channel): string {
        if (typeof channel.category !== 'string')
            throw new BBTagRuntimeError('Channel has no parent')
                .withDisplay('');

        return channel.category;
    }
}
