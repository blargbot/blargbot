import { Cluster } from '../cluster';
import { BaseSubtag, BBTagContext, SubtagCall} from '../core/bbtag';
import { SubtagType } from '../utils';

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
                    args: [],
                    description: 'Returns the type the current channel.',
                    exampleCode: '{channeltype}',
                    exampleOut: 'text',
                    execute: (ctx) => channelTypes[ctx.channel.type]
                },
                {
                    args: ['channel', 'quiet?'],
                    description: 'Returns the type the given `channel`. If it cannot be found returns `No channel found`, or nothing if `quiet` is `true`.',
                    exampleCode: '{channeltype;cool channel}\n{channeltype;some channel that doesn\'t exist;true}',
                    exampleOut: 'voice\n(nothing is returned here)',
                    execute: (ctx, args, subtag) => this.getChannelID(ctx, args.map(arg => arg.value), subtag)

                }
            ]
        });
    }

    public async getChannelID(
        context: BBTagContext,
        args: string[],
        subtag: SubtagCall
    ) {
        const channel = await context.getChannel(args[0]);
        const quiet = typeof context.scope.quiet === 'boolean' ? context.scope.quiet : !!args[1];
        if (!channel)
            return quiet ? '' : this.channelNotFound(context, subtag, `${args[0]} could not be found`);
        return channelTypes[channel.type];
    }
}