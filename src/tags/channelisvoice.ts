import { Cluster } from '../cluster';
import { BaseSubtag, BBTagContext, SubtagCall } from '../core/bbtag';
import { SubtagType } from '../utils';

export class ChannelIsVoice extends BaseSubtag {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, {
            name: 'channelisvoice',
            aliases: ['isvoice'],
            category: SubtagType.API,
            definition: [
                {
                    parameters: [],
                    description: 'Checks if the current channel is a voice channel.',
                    exampleCode: '{if;{isvoice};Yeah you can write stuff here;How did you even call the command?}',
                    exampleOut: 'How did you even call the command?',
                    //@ts-expect-error why is this even supported lol??
                    execute: (ctx) => (ctx.channel.type === 2).toString()
                },
                {
                    parameters: ['channel', 'quiet?'],
                    description: 'Checks if `channel` is a voice channel. If it cannot be found returns `No channel found`, or `false` if `quiet` is `true`.',
                    exampleCode: '{isvoice;blarg podcats}',
                    exampleOut: 'true',
                    execute: (ctx, args, subtag) => this.isVoiceChannel(ctx, args.map(arg => arg.value), subtag)
                }
            ]
        });
    }

    public async isVoiceChannel(
        context: BBTagContext,
        args: string[],
        subtag: SubtagCall
    ): Promise<string> {

        const channel = await context.getChannel(args[0]);
        const quiet = typeof context.scope.quiet === 'boolean' ? context.scope.quiet : !!args[1];
        if (!channel)
            return quiet ? 'false' : this.channelNotFound(context, subtag, `${args[0]} could not be found`);
        return (channel.type === 2).toString();
    }
}
