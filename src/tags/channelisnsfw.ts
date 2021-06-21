import { Cluster } from '../cluster';
import { BaseSubtag, BBTagContext, SubtagCall } from '../core/bbtag';
import { SubtagType } from '../utils';

export class ChannelIsNsfw extends BaseSubtag {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, {
            name: 'channelisnsfw',
            category: SubtagType.API,
            aliases: ['isnsfw'],
            definition: [
                {
                    parameters: [],
                    description: 'Checks if the current channel is a NSFW channel.',
                    exampleCode: '{if;{isnsfw};Spooky nsfw stuff;fluffy bunnies}',
                    exampleOut: 'fluffy bunnies',
                    execute: (ctx) => ctx.channel.nsfw.toString()
                },
                {
                    parameters: ['channel', 'quiet?'],
                    description: 'Checks if `channel` is a NSFW channel. If it cannot be found returns `No channel found`, or `false` if `quiet` is `true`.',
                    exampleCode: '{isnsfw;SFW Cat pics}',
                    exampleOut: 'true',
                    execute: (ctx, args, subtag) => this.isNsfwChannel(ctx, args.map(arg => arg.value), subtag)
                }
            ]
        });
    }

    public async isNsfwChannel(
        context: BBTagContext,
        args: string[],
        subtag: SubtagCall
    ): Promise<string> {
        const quiet = typeof context.scope.quiet === 'boolean' ? context.scope.quiet : !!args[1];
        const channel = await context.getChannel(args[0], { quiet, suppress: context.scope.suppressLookup });
        if (!channel)
            return quiet ? 'false' : this.channelNotFound(context, subtag, `${args[0]} could not be found`);
        return channel.nsfw.toString();
    }
}