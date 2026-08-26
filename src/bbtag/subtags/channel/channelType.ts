import * as eris from 'eris';

import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { ChannelNotFoundError } from '../../errors/index.js';
import templates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

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
    [eris.Constants.ChannelTypes.GUILD_TEXT]: 'text',
    [eris.Constants.ChannelTypes.DM]: 'dm',
    [eris.Constants.ChannelTypes.GUILD_VOICE]: 'voice',
    [eris.Constants.ChannelTypes.GROUP_DM]: 'group-dm',
    [eris.Constants.ChannelTypes.GUILD_CATEGORY]: 'category',
    [eris.Constants.ChannelTypes.GUILD_NEWS]: 'news',
    [eris.Constants.ChannelTypes.GUILD_STORE]: 'store',
    [eris.Constants.ChannelTypes.GUILD_NEWS_THREAD]: 'news-thread',
    [eris.Constants.ChannelTypes.GUILD_PRIVATE_THREAD]: 'private-thread',
    [eris.Constants.ChannelTypes.GUILD_PUBLIC_THREAD]: 'public-thread',
    [eris.Constants.ChannelTypes.GUILD_STAGE_VOICE]: 'stage-voice'
} as const;
