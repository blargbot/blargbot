import { Constants } from 'eris';

import { BBTagContext } from '../../BBTagContext';
import { DefinedSubtag } from '../../DefinedSubtag';
import { ChannelNotFoundError } from '../../errors';
import { SubtagType } from '../../utils';

export class ChannelTypeSubtag extends DefinedSubtag {
    public constructor() {
        super({
            name: 'channeltype',
            category: SubtagType.CHANNEL,
            desc: 'Possible results: ' + Object.values(channelTypes).map(t => '`' + t + '`').join(', '),
            definition: [
                {
                    parameters: [],
                    description: 'Returns the type the current channel.',
                    exampleCode: '{channeltype}',
                    exampleOut: 'text',
                    returns: 'string',
                    execute: (ctx) => this.getChannelType(ctx, ctx.channel.id, true)
                },
                {
                    parameters: ['channel', 'quiet?'],
                    description: 'Returns the type the given `channel`. If it cannot be found returns `No channel found`, or nothing if `quiet` is `true`.',
                    exampleCode: '{channeltype;cool channel}\n{channeltype;some channel that doesn\'t exist;true}',
                    exampleOut: 'voice\n(nothing is returned here)',
                    returns: 'string',
                    execute: (ctx, [channel, quiet]) => this.getChannelType(ctx, channel.value, quiet.value !== '')

                }
            ]
        });
    }

    public async getChannelType(context: BBTagContext, channelStr: string, quiet: boolean): Promise<typeof channelTypes[keyof typeof channelTypes] | ''> {
        quiet ||= context.scopes.local.quiet ?? false;
        const channel = await context.queryChannel(channelStr, { noLookup: quiet });
        if (channel === undefined) {
            throw new ChannelNotFoundError(channelStr)
                .withDisplay(quiet ? '' : undefined);
        }
        return channelTypes[channel.type];
    }
}

const channelTypes = {
    [Constants.ChannelTypes.GUILD_TEXT]: 'text',
    [Constants.ChannelTypes.DM]: 'dm',
    [Constants.ChannelTypes.GUILD_VOICE]: 'voice',
    [Constants.ChannelTypes.GROUP_DM]: 'group-dm',
    [Constants.ChannelTypes.GUILD_CATEGORY]: 'category',
    [Constants.ChannelTypes.GUILD_NEWS]: 'news',
    [Constants.ChannelTypes.GUILD_STORE]: 'store',
    [Constants.ChannelTypes.GUILD_NEWS_THREAD]: 'news-thread',
    [Constants.ChannelTypes.GUILD_PRIVATE_THREAD]: 'private-thread',
    [Constants.ChannelTypes.GUILD_PUBLIC_THREAD]: 'public-thread',
    [Constants.ChannelTypes.GUILD_STAGE_VOICE]: 'stage-voice'
} as const;
