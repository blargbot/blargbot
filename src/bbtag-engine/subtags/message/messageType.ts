import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { ChannelNotFoundError, MessageNotFoundError } from '../../errors/index.js';
import { templates } from '../../text.js';
import { SubtagType } from '../../utils/index.js';
import { ChannelIdSubtag } from '../channel/channelId.js';

const tag = templates.subtags.messageType;

export interface GetMessageTypeFeature {
    getMessageType(channelId: string, messageId: string): Promise<number | undefined>;
}

type Features = GetMessageTypeFeature
export class MessageTypeSubtag extends CompiledSubtag {
    readonly #features: Features;
    public constructor(features: Features) {
        super({
            name: 'messageType',
            category: SubtagType.MESSAGE,
            description: tag.description,
            definition: [
                {
                    parameters: [],
                    description: tag.trigger.description,
                    exampleCode: tag.trigger.exampleCode,
                    exampleOut: tag.trigger.exampleOut,
                    returns: 'number',
                    execute: (ctx) => this.getCurrentMessageType(ctx)
                },
                {
                    parameters: ['channel?', 'messageID'],
                    description: tag.other.description,
                    exampleCode: tag.other.exampleCode,
                    exampleOut: tag.other.exampleOut,
                    returns: 'number',
                    execute: (ctx, [channel, messageId]) => this.getMessageType(ctx, channel.value, messageId.value)
                }
            ]
        });
        this.#features = features;
    }

    public async getCurrentMessageType(
        context: BBTagContext
    ): Promise<number> {
        return await this.#features.getMessageType(context.local.channelId, context.local.messageId)
            ?? new MessageNotFoundError(context.local.channelId, context.local.messageId).throw();
    }

    public async getMessageType(
        context: BBTagContext,
        channelStr: string,
        messageId: string
    ): Promise<number> {
        if (messageId === '')
            messageId = context.local.messageId;

        const channelId = await ChannelIdSubtag.query(context, channelStr)
            ?? new ChannelNotFoundError(channelStr).throw();

        return await this.#features.getMessageType(channelId, messageId)
            ?? new MessageNotFoundError(channelId, messageId).throw();
    }
}
