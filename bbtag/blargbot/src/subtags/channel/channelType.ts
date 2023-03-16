import { ChannelType } from '@blargbot/discord-types';

import type { BBTagScript } from '../../BBTagScript.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { ChannelNotFoundError } from '../../errors/index.js';
import type { ChannelService } from '../../services/ChannelService.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import type { Entities } from '../../types.js';
import { SubtagType } from '../../utils/index.js';

const tag = textTemplates.subtags.channelType;

@Subtag.id('channelType')
@Subtag.ctorArgs('channels')
export class ChannelTypeSubtag extends CompiledSubtag {
    readonly #channels: ChannelService;

    public constructor(channels: ChannelService) {
        super({
            category: SubtagType.CHANNEL,
            description: tag.description({ types: Object.values(channelTypes) }),
            definition: [
                {
                    parameters: [],
                    description: tag.current.description,
                    exampleCode: tag.current.exampleCode,
                    exampleOut: tag.current.exampleOut,
                    returns: 'string',
                    execute: (ctx) => this.getChannelType(ctx, ctx.runtime.channel.id, true)
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

        this.#channels = channels;
    }

    public async getChannelType(context: BBTagScript, channelStr: string, quiet: boolean): Promise<typeof channelTypes[keyof typeof channelTypes] | ''> {
        quiet ||= context.runtime.scopes.local.quiet ?? false;
        const channel = await this.#channels.querySingle(context.runtime, channelStr, { noLookup: quiet });
        if (channel === undefined) {
            throw new ChannelNotFoundError(channelStr)
                .withDisplay(quiet ? '' : undefined);
        }
        return channelTypes[channel.type];
    }
}

const channelTypes: Record<Entities.Channel['type'], string> = {
    [ChannelType.GuildText]: 'text',
    [ChannelType.GuildVoice]: 'voice',
    [ChannelType.GuildCategory]: 'category',
    [ChannelType.GuildAnnouncement]: 'news',
    [ChannelType.AnnouncementThread]: 'news-thread',
    [ChannelType.PrivateThread]: 'private-thread',
    [ChannelType.PublicThread]: 'public-thread',
    [ChannelType.GuildStageVoice]: 'stage-voice',
    [ChannelType.GuildForum]: 'forum'
} as const;
