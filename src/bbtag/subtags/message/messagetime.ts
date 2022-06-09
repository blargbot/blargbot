import { snowflake } from '@blargbot/core/utils';
import moment from 'moment-timezone';

import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { ChannelNotFoundError, MessageNotFoundError } from '../../errors';
import { SubtagType } from '../../utils';

export class MessageTimeSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'messagetime',
            category: SubtagType.MESSAGE,
            aliases: ['timestamp'],
            definition: [
                {
                    parameters: [],
                    returns: 'string',
                    execute: (ctx) => this.getMessageTime(ctx, ctx.channel.id, ctx.message.id, 'x')
                },
                {
                    parameters: ['format|messageid'],
                    returns: 'string',
                    execute: (context, [formatOrMessageId]) => {
                        if (snowflake.test(formatOrMessageId.value))
                            return this.getMessageTime(context, context.channel.id, formatOrMessageId.value, 'x');
                        return this.getMessageTime(context, context.channel.id, context.message.id, formatOrMessageId.value);
                    }
                },
                {
                    parameters: ['channel|messageid', 'messageid|format'],
                    returns: 'string',
                    execute: async (context, [channelOrMessageId, messageIdOrFormat]) => {
                        if (snowflake.test(messageIdOrFormat.value))
                            return await this.getMessageTime(context, channelOrMessageId.value, messageIdOrFormat.value, 'x');
                        return await this.getMessageTime(context, context.channel.id, channelOrMessageId.value, messageIdOrFormat.value);
                    }
                },
                {
                    parameters: ['channel', 'messageid', 'format:x'],
                    returns: 'string',
                    execute: (context, [channel, message, format]) => this.getMessageTime(context, channel.value, message.value, format.value)
                },
                {
                    parameters: ['format?:x'],
                    description: 'Returns the send time of the executing message in `format`',
                    exampleCode: 'The send timestamp of your message is "{messagetime}"',
                    exampleOut: 'The send timestamp of your message is "1628782144703"'
                },
                {
                    parameters: ['messageid', 'format?:x'],
                    description: 'Returns the send time of `messageid` in `format`',
                    exampleCode: 'The send timestamp of message 11111111111111 is "{messagetime;11111111111111}',
                    exampleOut: 'The send timestamp of message 11111111111111 is "1628782144703"'
                },
                {
                    parameters: ['channel', 'messageid', 'format?:x'],
                    description: 'Returns the send time of `messageid` from `channel` in `format`.',
                    exampleCode: 'Message 11111111111111 in #support was sent at {messagetime;support;11111111111111;HH:mm}',
                    exampleOut: 'Message 11111111111111 in #support was sent at 18:09'
                }
            ]
        });
    }

    public async getMessageTime(
        context: BBTagContext,
        channelStr: string,
        messageStr: string,
        format: string
    ): Promise<string> {
        const channel = await context.queryChannel(channelStr, { noLookup: true }); //TODO lookup
        if (channel === undefined)
            throw new ChannelNotFoundError(channelStr);

        const message = await context.getMessage(channel, messageStr);
        if (message === undefined)
            throw new MessageNotFoundError(channel.id, messageStr);
        return moment(message.timestamp).format(format);
    }
}
