import { Cluster } from '../Cluster';
import { BaseSubtag, BBTagContext, SubtagCall, SubtagType } from '../core';

const channelTypes = ['text', 'dm', 'voice', 'group-dm', 'category', 'news', 'store'];

export class ChannelTypeSubtag extends BaseSubtag {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, {
            name: 'channeltype',
            category: SubtagType.API,
            desc: 'Possible results: ' + channelTypes.map(t => '`' + t + '`').join(', '),
            definition: [
                {
                    parameters: [],
                    description: 'Returns the type the current channel.',
                    exampleCode: '{channeltype}',
                    exampleOut: 'text',
                    execute: (ctx) => channelTypes[ctx.channel.type]
                },
                {
                    parameters: ['channel', 'quiet?'],
                    description: 'Returns the type the given `channel`. If it cannot be found returns `No channel found`, or nothing if `quiet` is `true`.',
                    exampleCode: '{channeltype;cool channel}\n{channeltype;some channel that doesn\'t exist;true}',
                    exampleOut: 'voice\n(nothing is returned here)',
                    execute: (ctx, [channel, quiet], subtag) => this.getChannelId(ctx, channel.value, quiet.value, subtag)

                }
            ]
        });
    }

    public async getChannelId(
        context: BBTagContext,
        channelStr: string,
        quietStr: string,
        subtag: SubtagCall
    ): Promise<string> {
        const quiet = typeof context.scope.quiet === 'boolean' ? context.scope.quiet : quietStr.length > 0;
        const channel = await context.getChannel(channelStr, { quiet, suppress: context.scope.suppressLookup });
        if (channel === undefined)
            return quiet ? '' : this.channelNotFound(context, subtag, `${channelStr} could not be found`);
        return channelTypes[channel.type];
    }
}
