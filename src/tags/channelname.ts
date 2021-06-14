import { Cluster } from '../cluster';
import { BaseSubtag, BBTagContext, SubtagCall} from '../core/bbtag';
import { SubtagType } from '../utils';

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
                    args: [],
                    description: 'Returns the name of the current channel.',
                    exampleCode: 'This channel\'s name is {channelname}',
                    exampleOut: 'This channel\'s name is test-channel',
                    execute: (ctx) => ctx.channel.name
                },
                {
                    args: ['channel', 'quiet?'],
                    description: 'Returns the name of the given `channel`. If it cannot be found returns `No channel found`, or nothing if `quiet` is `true`.',
                    exampleCode: '{channelname;111111111111111}',
                    exampleOut: 'cooler-test-channel',
                    execute: (ctx, args, subtag) => this.getChannelName(ctx, args.map(arg => arg.value), subtag)
                }
            ]
        });
    }

    public async getChannelName(
        context: BBTagContext,
        args: string[],
        subtag: SubtagCall
    ) {
        const channel = await context.getChannel(args[0]);
        const quiet = typeof context.scope.quiet === 'boolean' ? context.scope.quiet : !!args[1];
        if (!channel)
            return quiet ? '' : this.channelNotFound(context, subtag, `${args[0]} could not be found`);
        return channel.name;
    }
}