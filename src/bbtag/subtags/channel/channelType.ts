import { Constants } from 'eris';

import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { ChannelNotFoundError } from '../../errors';
import templates from '../../text';
import { SubtagType } from '../../utils';

const tag = templates.subtags.channelType;

export class ChannelTypeSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'channelType',
            category: SubtagType.CHANNEL,
            description: tag.description({ types: Object.values(channelTypes) }),
            definition: [
                {
                    parameters: [],
                    description: tag.current.description,
                    exampleCode: tag.current.exampleCode,
                    exampleOut: tag.current.exampleOut,
                    returns: 'string',
                    execute: (ctx) => this.getChannelType(ctx, ctx.channel.id, true)
                },
                {
                    parameters: ['channel', 'quiet?'],
                    description: tag.channel.description,
                    exampleCode: tag.channel.exampleCode,
                    exampleOut: tag.channel.exampleOut,
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
