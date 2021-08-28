import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { SubtagCall } from '@cluster/types';
import { SubtagType } from '@cluster/utils';

export class ChannelCategorySubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'channelcategory',
            aliases: ['category'],
            category: SubtagType.CHANNEL,
            definition: [
                {
                    parameters: [],
                    description: 'Returns the category ID of the current channel.',
                    exampleCode: '{channelcategory}',
                    exampleOut: '111111111111111',
                    execute: (ctx) => ctx.channel.id
                },
                {
                    parameters: ['channel', 'quiet?'],
                    description: 'Returns the category ID of the provided `channel`. If the provided `channel` is a category this returns nothing. If it cannot be found returns `No channel found`, or nothing if `quiet` is `true`.',
                    exampleCode: '{channelcategory;cool channel}\n{channelcategory;cool category}',
                    exampleOut: '111111111111111\n(nothing is returned here)',
                    execute: (ctx, [channel, quiet], subtag) => this.getCategory(ctx, channel.value, quiet.value !== '', subtag)
                }
            ]
        });
    }

    public async getCategory(
        context: BBTagContext,
        channelStr: string,
        quiet: boolean,
        subtag: SubtagCall
    ): Promise<string> {
        quiet ||= context.scope.quiet ?? false;
        const channel = await context.queryChannel(channelStr, { noLookup: quiet });
        if (channel === undefined)
            return quiet ? '' : this.channelNotFound(context, subtag, `${channelStr} could not be found`);
        return channel.parent?.id ?? '';
    }
}
