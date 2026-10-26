import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError, ChannelNotFoundError } from '../../errors/index.js';
import { templates } from '../../text.js';
import { SubtagType } from '../../utils/index.js';
import { ChannelIdSubtag } from './channelId.js';
import { ChannelIsTextSubtag } from './channelIsText.js';

const tag = templates.subtags.lastMessageId;

export interface GetLastMessageIdFeature {
    getLastMessageId(guildId: string, channelId: string): Promise<string | undefined>;
}

type Features = GetLastMessageIdFeature;
export class LastMessageIdSubtag extends CompiledSubtag {
    readonly #features: Features;
    public constructor(features: Features) {
        super({
            name: 'lastMessageId',
            category: SubtagType.CHANNEL,
            description: tag.description,
            definition: [
                {
                    parameters: [],
                    description: tag.current.description,
                    exampleCode: tag.current.exampleCode,
                    exampleOut: tag.current.exampleOut,
                    returns: 'id',
                    execute: (ctx) => this.currentChannel(ctx)
                },
                {
                    parameters: ['channel'],
                    description: tag.channel.description,
                    exampleCode: tag.channel.exampleCode,
                    exampleOut: tag.channel.exampleOut,
                    returns: 'id',
                    execute: (ctx, [channel]) => this.queryChannel(ctx, channel.value)
                }
            ]
        });
        this.#features = features;
    }

    public async currentChannel(context: BBTagContext): Promise<string> {
        return await this.#impl(context, context.local.message.channel.id);
    }

    public async queryChannel(context: BBTagContext, channelStr: string): Promise<string> {
        const channelId = await ChannelIdSubtag.query(context, channelStr)
            ?? new ChannelNotFoundError(channelStr).throw();
        return await this.#impl(context, channelId);
    }

    async #impl(context: BBTagContext, channelId: string): Promise<string> {
        if (!await ChannelIsTextSubtag.check(context, channelId))
            throw new BBTagRuntimeError('Channel must be a textable channel');
        return await this.#features.getLastMessageId(context.root.guildId, channelId) ?? '';
    }
}
