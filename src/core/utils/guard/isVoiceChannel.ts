import { Channel, Constants, VoiceChannel } from 'eris';

export function isVoiceChannel<T extends Channel>(channel: T): channel is VoiceChannel & T {
    switch (channel.type) {
        case Constants.ChannelTypes.GUILD_VOICE:
            return true;
        default:
            return false;
    }
}
