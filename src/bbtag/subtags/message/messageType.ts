import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { ChannelNotFoundError, MessageNotFoundError } from '../../errors/index.js';
import { templates } from '../../text.js';
import { SubtagType } from '../../utils/index.js';
import { ChannelIdSubtag } from '../channel/channelId.js';

const tag = templates.subtags.messageType;

export interface GetMessageTypeThunk {
    (channelId: string, messageId: string): Promise<number | undefined>;
}

export class MessageTypeSubtag extends CompiledSubtag {
    readonly #getMessageType: GetMessageTypeThunk;
    public constructor({ getMessageType }: { getMessageType: GetMessageTypeThunk; }) {
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
        this.#getMessageType = getMessageType;
    }

    public async getCurrentMessageType(
        context: BBTagContext
    ): Promise<number> {
        return await this.#getMessageType(context.local.message.channel.id, context.local.message.id)
            ?? new MessageNotFoundError(context.local.message.channel.id, context.local.message.id).throw();
    }

    public async getMessageType(
        context: BBTagContext,
        channelStr: string,
        messageId: string
    ): Promise<number> {
        if (messageId === '')
            messageId = context.local.message.id;

        const channelId = await ChannelIdSubtag.query(context, channelStr)
            ?? new ChannelNotFoundError(channelStr).throw();

        return await this.#getMessageType(channelId, messageId)
            ?? new MessageNotFoundError(channelId, messageId).throw();
    }
}
