import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { SubtagCall } from '@cluster/types';
import { SubtagType } from '@cluster/utils';

export class ChannelPosSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'channelpos',
            aliases: ['categorypos'],
            category: SubtagType.API,
            desc: 'The position is the index per channel type (text, voice or category) in the channel list.',
            definition: [
                {
                    parameters: [],
                    description: 'Returns the position of the current channel.',
                    exampleCode: 'This channel is in position {channelpos}',
                    exampleOut: 'This channel is in position 1',
                    execute: (ctx) => ctx.channel.position.toString()
                },
                {
                    parameters: ['channel', 'quiet?'],
                    description: 'Returns the position of the given `channel`. If it cannot be found returns `No channel found`, or nothing if `quiet` is `true`.',
                    exampleCode: 'The position of test-channel is {channelpos;test-channel}',
                    exampleOut: 'The position of test-channel is 0',
                    execute: (ctx, [channel, quiet], subtag) => this.getChannelPosition(ctx, channel.value, quiet.value, subtag)
                }
            ]
        });
    }

    public async getChannelPosition(
        context: BBTagContext,
        channelStr: string,
        quietStr: string,
        subtag: SubtagCall
    ): Promise<string> {
        const quiet = typeof context.scope.quiet === 'boolean' ? context.scope.quiet : quietStr.length > 0;
        const channel = await context.getChannel(channelStr, { quiet, suppress: context.scope.suppressLookup });
        if (channel === undefined)
            return quiet ? '' : this.channelNotFound(context, subtag, `${channelStr} could not be found`);
        return channel.position.toString();
    }
}
