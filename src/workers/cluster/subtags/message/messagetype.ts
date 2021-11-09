import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { ChannelNotFoundError } from '@cluster/bbtag/errors';
import { SubtagCall } from '@cluster/types';
import { SubtagType } from '@cluster/utils';
import { Constants } from 'discord.js';

export class MessageTypeSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'messagetype',
            category: SubtagType.MESSAGE,
            desc: 'For more info about message types, visit the [discord docs]().',
            definition: [
                {
                    parameters: [],
                    description: 'Returns the message type of the executing message.',
                    exampleCode: '{messagetype}',
                    exampleOut: '0',
                    execute: async (ctx, _, subtag) => this.getCurrentMessageType(ctx, subtag)
                },
                {
                    parameters: ['channel?', 'messageID'],
                    description: '`channel` defaults to the current channel.\n\nReturns the message type of `messageID` in `channel`',
                    exampleCode: '{messagetype;12345678912345;123465145791}\n{messagetype;1234567891234}',
                    exampleOut: '19\n0',
                    execute: async (ctx, args, subtag) => this.getMessageType(ctx, args[0].value, args[1].value, subtag)
                }
            ]
        });
    }

    public async getCurrentMessageType(
        context: BBTagContext,
        subtag: SubtagCall
    ): Promise<string> {
        const msg = await context.util.getMessage(context.channel, context.message.id);
        if (msg === undefined)
            return this.noMessageFound(context, subtag);
        return Constants.MessageTypes.indexOf(msg.type).toString();
    }

    public async getMessageType(
        context: BBTagContext,
        channelStr: string,
        messageID: string,
        subtag: SubtagCall
    ): Promise<string> {
        const channel = await context.queryChannel(channelStr);
        if (channel === undefined)
            throw new ChannelNotFoundError(channelStr);
        let message;
        try {
            message = await context.util.getMessage(channel, messageID);
            if (message === undefined)
                return this.noMessageFound(context, subtag);
        } catch (e: unknown) {
            context.logger.error(e);
            return this.noMessageFound(context, subtag);
        }

        return Constants.MessageTypes.indexOf(message.type).toString();
    }
}
