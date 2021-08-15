import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { SubtagCall } from '@cluster/types';
import { SubtagType } from '@cluster/utils';

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
                    execute: (ctx) => JSON.stringify(ctx.guild.channels.cache.map(c => c.id))
                },
                {
                    parameters: ['category', 'quiet?'],
                    description: 'Returns an array of channel IDs in within the given `category`. If `category` is not a category, returns an empty array. If `category` cannot be found returns `No channel found`, or nothing if `quiet` is `true`.',
                    exampleCode: 'Category cat-channels has {length;{channels;cat-channels}} channels.',
                    exampleOut: 'Category cat-channels has 6 channels.',
                    execute: (ctx, [category, quiet], subtag) => this.getChannelsInCategory(ctx, category.value, quiet.value !== '', subtag)
                }
            ]
        });
    }

    public async getChannelsInCategory(
        context: BBTagContext,
        channelStr: string,
        quiet: boolean,
        subtag: SubtagCall
    ): Promise<string> {
        quiet ||= context.scope.quiet ?? false;
        const channel = await context.queryChannel(channelStr, { noLookup: quiet });
        if (channel === undefined)
            return quiet ? '' : this.channelNotFound(context, subtag, `${channelStr} could not be found`);
        if (channel.type !== 'GUILD_CATEGORY')
            return '[]';
        return JSON.stringify(channel.children.map(c => c.id));
    }
}
