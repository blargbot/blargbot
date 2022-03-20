import { guard } from '@blargbot/core/utils';

import { BBTagContext } from '../../BBTagContext';
import { DefinedSubtag } from '../../DefinedSubtag';
import { ChannelNotFoundError } from '../../errors';
import { SubtagType } from '../../utils';

export class ChannelsSubtag extends DefinedSubtag {
    public constructor() {
        super({
            name: 'channels',
            category: SubtagType.CHANNEL,
            definition: [
                {
                    parameters: [],
                    description: 'Returns an array of channel IDs in the current guild',
                    exampleCode: 'This guild has {length;{channels}} channels.',
                    exampleOut: 'This guild has {length;{channels}} channels.',
                    returns: 'id[]',
                    execute: (ctx) => this.getChannels(ctx)
                },
                {
                    parameters: ['category', 'quiet?'],
                    description: 'Returns an array of channel IDs in within the given `category`. If `category` is not a category, returns an empty array. If `category` cannot be found returns `No channel found`, or nothing if `quiet` is `true`.',
                    exampleCode: 'Category cat-channels has {length;{channels;cat-channels}} channels.',
                    exampleOut: 'Category cat-channels has 6 channels.',
                    returns: 'id[]',
                    execute: (ctx, [category, quiet]) => this.getChannelsInCategory(ctx, category.value, quiet.value !== '')
                }
            ]
        });
    }

    public getChannels(context: BBTagContext): string[] {
        return context.guild.channels.map(c => c.id);
    }

    public async getChannelsInCategory(context: BBTagContext, channelStr: string, quiet: boolean): Promise<string[]> {
        quiet ||= context.scopes.local.quiet ?? false;
        const channel = await context.queryChannel(channelStr, { noLookup: quiet });
        if (channel === undefined) {
            throw new ChannelNotFoundError(channelStr)
                .withDisplay(quiet ? '' : undefined);
        }
        if (!guard.isCategoryChannel(channel))
            return [];
        return channel.channels.map(c => c.id);
    }
}
