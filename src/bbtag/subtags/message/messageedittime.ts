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
            description: tag.description, //TODO Change this
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
                    description: tag.trigger.description,
                    exampleCode: tag.trigger.exampleCode,
                    exampleOut: tag.trigger.exampleOut
                },
                {
                    parameters: ['messageid', 'format?:x'],
                    description: tag.inCurrent.description,
                    exampleCode: tag.inCurrent.exampleCode,
                    exampleOut: tag.inCurrent.exampleOut
                },
                {
                    parameters: ['channel', 'messageid', 'format?:x'],
                    description: tag.inOther.description,
                    exampleCode: tag.inOther.exampleCode,
                    exampleOut: tag.inOther.exampleOut
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
