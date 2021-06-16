import { Cluster } from '../cluster';
import { BaseSubtag, BBTagContext, SubtagCall} from '../core/bbtag';
import { SubtagType } from '../utils';

export class ChannelPosSubtag extends BaseSubtag {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, {
            name: 'channelpos',
            aliases: ['categorypos'],
            category: SubtagType.API,
            desc: 'The position is the index per channel type (text, voice or category) in the channel list.',
            definition: [
                {
                    args: [],
                    description: 'Returns the position of the current channel.',
                    exampleCode: 'This channel is in position {channelpos}',
                    exampleOut: 'This channel is in position 1',
                    execute: (ctx) => ctx.channel.position.toString()
                },
                {
                    args: ['channel', 'quiet?'],
                    description: 'Returns the position of the given `channel`. If it cannot be found returns `No channel found`, or nothing if `quiet` is `true`.',
                    exampleCode: 'The position of test-channel is {channelpos;test-channel}',
                    exampleOut: 'The position of test-channel is 0',
                    execute: (ctx, args, subtag) => this.getChannelPosition(ctx, args.map(arg => arg.value), subtag)
                }
            ]
        });
    }

    public async getChannelPosition(
        context: BBTagContext,
        args: string[],
        subtag: SubtagCall
    ): Promise<string> {
        const channel = await context.getChannel(args[0]);
        const quiet = typeof context.scope.quiet === 'boolean' ? context.scope.quiet : !!args[1];
        if (!channel)
            return quiet ? '' : this.channelNotFound(context, subtag, `${args[0]} could not be found`);
        return channel.position.toString();
    }
}