import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { ChannelNotFoundError } from '@cluster/bbtag/errors';
import { SubtagCall } from '@cluster/types';
import { SubtagType } from '@cluster/utils';
import { guard } from '@core/utils';
import { GuildChannels } from 'discord.js';

export class ChannelPosSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'channelpos',
            aliases: ['categorypos'],
            category: SubtagType.CHANNEL,
            desc: 'The position is the index per channel type (text, voice or category) in the channel list.',
            definition: [
                {
                    parameters: [],
                    description: 'Returns the position of the current channel.',
                    exampleCode: 'This channel is in position {channelpos}',
                    exampleOut: 'This channel is in position 1',
                    execute: (ctx, _, subtag) => this.getChanelPositionCore(ctx, ctx.channel, subtag)
                },
                {
                    parameters: ['channel', 'quiet?'],
                    description: 'Returns the position of the given `channel`. If it cannot be found returns `No channel found`, or nothing if `quiet` is `true`.',
                    exampleCode: 'The position of test-channel is {channelpos;test-channel}',
                    exampleOut: 'The position of test-channel is 0',
                    execute: (ctx, [channel, quiet], subtag) => this.getChannelPosition(ctx, channel.value, quiet.value !== '', subtag)
                }
            ]
        });
    }

    public async getChannelPosition(
        context: BBTagContext,
        channelStr: string,
        quiet: boolean,
        subtag: SubtagCall
    ): Promise<string> {
        quiet ||= context.scopes.local.quiet ?? false;
        const channel = await context.queryChannel(channelStr, { noLookup: quiet });
        if (channel === undefined) {
            if (quiet)
                return '';
            throw new ChannelNotFoundError(channelStr);
        }

        return this.getChanelPositionCore(context, channel, subtag);
    }

    private getChanelPositionCore(context: BBTagContext, channel: GuildChannels, subtag: SubtagCall): string {
        if (guard.isThreadChannel(channel))
            return this.customError('Threads dont have a position', context, subtag, `${channel.toString()} is a thread and doesnt have a position`);

        return channel.position.toString();
    }
}
