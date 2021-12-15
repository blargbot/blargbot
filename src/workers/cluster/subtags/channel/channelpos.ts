import { BBTagContext, DefinedSubtag } from '@cluster/bbtag';
import { BBTagRuntimeError, ChannelNotFoundError } from '@cluster/bbtag/errors';
import { SubtagType } from '@cluster/utils';
import { guard } from '@core/utils';
import { GuildChannel } from 'eris';

export class ChannelPosSubtag extends DefinedSubtag {
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
                    returns: 'number',
                    execute: (ctx) => this.getChanelPositionCore(ctx.channel)
                },
                {
                    parameters: ['channel', 'quiet?'],
                    description: 'Returns the position of the given `channel`. If it cannot be found returns `No channel found`, or nothing if `quiet` is `true`.',
                    exampleCode: 'The position of test-channel is {channelpos;test-channel}',
                    exampleOut: 'The position of test-channel is 0',
                    returns: 'number',
                    execute: (ctx, [channel, quiet]) => this.getChannelPosition(ctx, channel.value, quiet.value !== '')
                }
            ]
        });
    }

    public async getChannelPosition(
        context: BBTagContext,
        channelStr: string,
        quiet: boolean
    ): Promise<number> {
        quiet ||= context.scopes.local.quiet ?? false;
        const channel = await context.queryChannel(channelStr, { noLookup: quiet });
        if (channel === undefined) {
            throw new ChannelNotFoundError(channelStr)
                .withDisplay(quiet ? '' : undefined);
        }

        return this.getChanelPositionCore(channel);
    }

    private getChanelPositionCore(channel: GuildChannel): number {
        if (guard.isThreadChannel(channel))
            throw new BBTagRuntimeError('Threads dont have a position', `${channel.mention} is a thread and doesnt have a position`);

        return channel.position;
    }
}
