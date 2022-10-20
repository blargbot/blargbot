import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { ChannelNotFoundError, MessageNotFoundError } from '../../errors';
import { SubtagType } from '../../utils';

export class MessageTypeSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'messagetype',
            category: SubtagType.MESSAGE,
            description: 'For more info about message types, visit the [discord docs]().',
            definition: [
                {
                    parameters: [],
                    description: 'Returns the message type of the executing message.',
                    exampleCode: '{messagetype}',
                    exampleOut: '0',
                    returns: 'number',
                    execute: (ctx) => this.getCurrentMessageType(ctx)
                },
                {
                    parameters: ['channel?', 'messageID'],
                    description: '`channel` defaults to the current channel.\n\nReturns the message type of `messageID` in `channel`',
                    exampleCode: '{messagetype;12345678912345;123465145791}\n{messagetype;1234567891234}',
                    exampleOut: '19\n0',
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
