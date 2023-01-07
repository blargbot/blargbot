import { booleanResultAdapter, Subtag } from '@bbtag/subtag';

import type { Channel } from '../../plugins/ChannelPlugin.js';
import { ChannelPlugin, ChannelType } from '../../plugins/ChannelPlugin.js';
import { p } from '../p.js';

export class ChannelIsVoiceSubtag extends Subtag {
    public constructor() {
        super({
            name: 'channelIsVoice',
            aliases: ['isVoice']
        });
    }

    @Subtag.signature({ id: 'current' })
        .parameter(p.plugin(ChannelPlugin).map(c => c.current))
        .convertResultUsing(booleanResultAdapter)
    @Subtag.signature({ id: 'channel' })
        .parameter(p.channel({ quietMode: 'arg' }))
        .convertResultUsing(booleanResultAdapter)
    public isVoice(channel: Channel): boolean {
        return voiceChannels.has(channel.type);
    }
}

const voiceChannels = new Set([
    ChannelType.DM,
    ChannelType.GROUP_DM,
    ChannelType.VOICE_STAGE,
    ChannelType.VOICE
] as const);
