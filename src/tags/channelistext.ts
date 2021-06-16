import { Cluster } from '../cluster';
import { BaseSubtag, BBTagContext, SubtagCall} from '../core/bbtag';
import { SubtagType } from '../utils';

export class ChannelIsText extends BaseSubtag {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, {
            name: 'channelistext',
            aliases: ['istext'],
            category: SubtagType.API,
            definition: [
                {
                    args: [],
                    description: 'Checks if the current channel is a text channel.',
                    exampleCode: '{if;{istext};Yeah you can write stuff here;How did you even call the command?}',
                    exampleOut: 'Yeah you can write stuff here',
                    execute: (ctx) => (ctx.channel.type === 0).toString()
                },
                {
                    args: ['channel', 'quiet?'],
                    description: 'Checks if `channel` is a text channel. If it cannot be found returns `No channel found`, or `false` if `quiet` is `true`.',
                    exampleCode: '{istext;feature discussions}',
                    exampleOut: 'true',
                    execute: (ctx, args, subtag) => this.isTextChannel(ctx, args.map(arg => arg.value), subtag)
                }
            ]
        });
    }

    public async isTextChannel(
        context: BBTagContext,
        args: string[],
        subtag: SubtagCall
    ): Promise<string> {

        const channel = await context.getChannel(args[0]);
        const quiet = typeof context.scope.quiet === 'boolean' ? context.scope.quiet : !!args[1];
        if (!channel)
            return quiet ? 'false' : this.channelNotFound(context, subtag, `${args[0]} could not be found`);
        return (channel.type === 0).toString();
    }
}
