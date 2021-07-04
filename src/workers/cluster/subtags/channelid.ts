import { BaseSubtag, BBTagContext, SubtagCall, SubtagType } from '../core';

export class ChannelIdSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'channelid',
            aliases: ['categoryid'],
            category: SubtagType.API,
            definition: [
                {
                    parameters: [],
                    description: 'Returns the ID of the current channel.',
                    exampleCode: '{channelid}',
                    exampleOut: '111111111111111',
                    execute: (ctx) => ctx.channel.id
                },
                {
                    parameters: ['channel', 'quiet?'],
                    description: 'Returns the ID of the given channel. If it cannot be found returns `No channel found`, or nothing if `quiet` is `true`.',
                    exampleCode: '{channelid;cool channel}\n{channelid;some channel that doesn\'t exist;true}',
                    exampleOut: '111111111111111\n(nothing is returned here)',
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
        return channel.id;
    }
}
