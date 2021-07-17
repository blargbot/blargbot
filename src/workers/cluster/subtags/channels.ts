import { Constants } from 'eris';
import { BaseSubtag, BBTagContext, SubtagCall, SubtagType } from '@cluster/core';

export class ChannelsSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'channels',
            category: SubtagType.API,
            definition: [
                {
                    parameters: [],
                    description: 'Returns an array of channel IDs in the current guild',
                    exampleCode: 'This guild has {length;{channels}} channels.',
                    exampleOut: 'This guild has {length;{channels}} channels.',
                    execute: (ctx) => JSON.stringify(ctx.guild.channels.map(c => c.id))
                },
                {
                    parameters: ['category', 'quiet?'],
                    description: 'Returns an array of channel IDs in within the given `category`. If `category` is not a category, returns an empty array. If `category` cannot be found returns `No channel found`, or nothing if `quiet` is `true`.',
                    exampleCode: 'Category cat-channels has {length;{channels;cat-channels}} channels.',
                    exampleOut: 'Category cat-channels has 6 channels.',
                    execute: (ctx, [category, quiet], subtag) => this.getChannelsInCategory(ctx, category.value, quiet.value, subtag)
                }
            ]
        });
    }

    public async getChannelsInCategory(
        context: BBTagContext,
        channelStr: string,
        quietStr: string,
        subtag: SubtagCall
    ): Promise<string> {
        const quiet = typeof context.scope.quiet === 'boolean' ? context.scope.quiet : quietStr.length > 0;
        const channel = await context.getChannel(channelStr, { quiet, suppress: context.scope.suppressLookup });
        if (channel === undefined)
            return quiet ? '' : this.channelNotFound(context, subtag, `${channelStr} could not be found`);
        if (channel.type !== Constants.ChannelTypes.GUILD_CATEGORY)
            return '[]';
        return JSON.stringify(channel.channels.map(c => c.id));
    }
}
