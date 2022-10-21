import { snowflake } from '@blargbot/core/utils';
import moment from 'moment-timezone';

import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { ChannelNotFoundError, MessageNotFoundError } from '../../errors';
import templates from '../../text';
import { SubtagType } from '../../utils';

const tag = templates.subtags.messageedittime;

export class MessageEditTimeSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'messageedittime',
            category: SubtagType.MESSAGE,
            description: 'If the message is not edited, this will return the current time instead.\n\n**Note:** there are plans to change this behaviour, but due to backwards-compatibility this remains unchanged.', //TODO Change this
            definition: [
                {
                    parameters: [],
                    returns: 'string',
                    execute: (ctx) => this.getMessageEditTime(ctx, ctx.channel.id, ctx.message.id, 'x')
                },
                {
                    parameters: ['format|messageid'],
                    returns: 'string',
                    execute: (context, [formatOrMessageId]) => {
                        if (snowflake.test(formatOrMessageId.value))
                            return this.getMessageEditTime(context, context.channel.id, formatOrMessageId.value, 'x');
                        return this.getMessageEditTime(context, context.channel.id, context.message.id, formatOrMessageId.value);
                    }
                },
                {
                    parameters: ['channel|messageid', 'messageid|format'],
                    returns: 'string',
                    execute: async (context, [channelOrMessageId, messageIdOrFormat]) => {
                        if (snowflake.test(messageIdOrFormat.value))
                            return await this.getMessageEditTime(context, channelOrMessageId.value, messageIdOrFormat.value, 'x');
                        return await this.getMessageEditTime(context, context.channel.id, channelOrMessageId.value, messageIdOrFormat.value);
                    }
                },
                {
                    parameters: ['channel', 'messageid', 'format:x'],
                    returns: 'string',
                    execute: (context, [channel, message, format]) => this.getMessageEditTime(context, channel.value, message.value, format.value)
                },
                {
                    parameters: ['format?:x'],
                    description: 'Returns the edit time of the executing message in `format`',
                    exampleCode: 'The edit timestamp of your message is "{messageedittime}"',
                    exampleOut: 'The edit timestamp of your message is "1628782144703"'
                },
                {
                    parameters: ['messageid', 'format?:x'],
                    description: 'Returns the edit time of `messageid` in `format`',
                    exampleCode: 'The edit timestamp of message 11111111111111 is "{messageedittime;11111111111111}',
                    exampleOut: 'The edit timestamp of message 11111111111111 is "1628782144703"'
                },
                {
                    parameters: ['channel', 'messageid', 'format?:x'],
                    description: 'Returns the edit time of `messageid` from `channel` in `format`.',
                    exampleCode: 'Message 11111111111111 in #support was edited at {messageedittime;support;11111111111111;HH:mm}',
                    exampleOut: 'Message 11111111111111 in #support was edited at 18:09'
                }
            ]
        });
    }

    public async getMessageEditTime(
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

        return message.editedTimestamp === undefined
            ? moment().format(format)
            : moment(message.editedTimestamp).format(format);
    }
}
