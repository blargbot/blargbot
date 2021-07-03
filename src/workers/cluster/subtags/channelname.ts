import { Cluster } from '../Cluster';
import { BaseSubtag, BBTagContext, SubtagCall, SubtagType } from '../core';

export class ChannelNameSubtag extends BaseSubtag {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, {
            name: 'channelname',
            aliases: ['categoryname'],
            category: SubtagType.API,
            definition: [
                {
                    parameters: [],
                    description: 'Returns the name of the current channel.',
                    exampleCode: 'This channel\'s name is {channelname}',
                    exampleOut: 'This channel\'s name is test-channel',
                    execute: (ctx) => ctx.channel.name
                },
                {
                    parameters: ['channel', 'quiet?'],
                    description: 'Returns the name of the given `channel`. If it cannot be found returns `No channel found`, or nothing if `quiet` is `true`.',
                    exampleCode: '{channelname;111111111111111}',
                    exampleOut: 'cooler-test-channel',
                    execute: (ctx, [channel, quiet], subtag) => this.getChannelName(ctx, channel.value, quiet.value, subtag)
                }
            ]
        });
    }

    public async getChannelName(
        context: BBTagContext,
        channelStr: string,
        quietStr: string,
        subtag: SubtagCall
    ): Promise<string> {
        const quiet = typeof context.scope.quiet === 'boolean' ? context.scope.quiet : quietStr.length > 0;
        const channel = await context.getChannel(channelStr, { quiet, suppress: context.scope.suppressLookup });
        if (channel === undefined)
            return quiet ? '' : this.channelNotFound(context, subtag, `${channelStr} could not be found`);
        return channel.name;
    }
}
