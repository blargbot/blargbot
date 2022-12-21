import { subtagParameter as p } from '../../execution/parameters/index.js';
import { Subtag } from '../../execution/Subtag.js';
import { ChannelNotFoundError, MessageNotFoundError } from '../../errors/index.js';

export class MessageTypeSubtag extends Subtag {
    public constructor() {
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
    }

    public async getCurrentMessageType(
        context: BBTagContext
    ): Promise<number> {
        const msg = await context.getMessage(context.channel, context.message.id);
        if (msg === undefined)
            throw new MessageNotFoundError(context.channel.id, context.message.id);
        return msg.type;
    }

    public async getMessageType(
        context: BBTagContext,
        channelStr: string,
        messageId: string
    ): Promise<number> {
        const channel = await context.queryChannel(channelStr);
        if (channel === undefined)
            throw new ChannelNotFoundError(channelStr);

        const message = await context.getMessage(channel, messageId);
        if (message === undefined)
            throw new MessageNotFoundError(channel.id, messageId);

        return message.type;
    }
}
