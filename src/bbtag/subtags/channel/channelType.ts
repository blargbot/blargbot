import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { ChannelType } from '../../enums.js';
import { ChannelNotFoundError } from '../../errors/index.js';
import { templates } from '../../text.js';
import { SubtagType } from '../../utils/index.js';
import { ChannelIdSubtag } from './channelId.js';

const tag = templates.subtags.channelType;

export interface GetChannelTypeThunk {
    (guildId: string, channelId: string): Promise<number | undefined>;
}

export class ChannelTypeSubtag extends CompiledSubtag {
    public static get typeMap(): typeof channelTypes {
        return channelTypes;
    }
    readonly #getChannelType: GetChannelTypeThunk;
    public constructor({ getChannelType }: { getChannelType: GetChannelTypeThunk; }) {
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
                    execute: (ctx) => this.currentChannel(ctx)
                },
                {
                    parameters: ['channel', 'quiet?'],
                    description: tag.channel.description,
                    exampleCode: tag.channel.exampleCode,
                    exampleOut: tag.channel.exampleOut,
                    returns: 'string',
                    execute: (ctx, [channel, quiet]) => this.queryChannel(ctx, channel.value, quiet.value !== '')

                }
            ]
        });
        this.#getChannelType = getChannelType;
    }

    public async currentChannel(context: BBTagContext): Promise<string> {
        return await this.#getChannelTypeStr(context, context.local.message.channel.id);
    }

    public async queryChannel(context: BBTagContext, channelStr: string, quiet: boolean): Promise<string> {
        const channelId = await ChannelIdSubtag.query(context, channelStr, { noLookup: quiet })
            ?? new ChannelNotFoundError(channelStr).withDisplay(quiet ? '' : undefined).throw();
        return await this.#getChannelTypeStr(context, channelId);
    }

    async #getChannelTypeStr(context: BBTagContext, channelId: string): Promise<string> {
        const channelType = await this.#getChannelType(context.root.guildId, channelId) ?? -1;
        if (!Object.hasOwn(channelTypes, channelType))
            return 'unknown';

        return channelTypes[channelType] ?? 'unknown';
    }
}
const channelTypes = {
    [ChannelType.GUILD_TEXT]: 'text',
    [ChannelType.DM]: 'dm',
    [ChannelType.GUILD_VOICE]: 'voice',
    [ChannelType.GROUP_DM]: 'group-dm',
    [ChannelType.GUILD_CATEGORY]: 'category',
    [ChannelType.GUILD_ANNOUNCEMENT]: 'news',
    [ChannelType.ANNOUNCEMENT_THREAD]: 'news-thread',
    [ChannelType.PRIVATE_THREAD]: 'private-thread',
    [ChannelType.PUBLIC_THREAD]: 'public-thread',
    [ChannelType.GUILD_STAGE_VOICE]: 'stage-voice',
    [ChannelType.GUILD_DIRECTORY]: 'directory',
    [ChannelType.GUILD_FORUM]: 'forum',
    [ChannelType.GUILD_MEDIA]: 'media'
} satisfies Record<ChannelType, string> as Record<number, string>;
Object.setPrototypeOf(channelTypes, null);
Object.freeze(channelTypes);
