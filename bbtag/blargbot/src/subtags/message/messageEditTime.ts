import { snowflake } from '@blargbot/discord-util';
import moment from 'moment-timezone';

import type { BBTagScript } from '../../BBTagScript.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { ChannelNotFoundError, MessageNotFoundError } from '../../errors/index.js';
import type { ChannelService } from '../../services/ChannelService.js';
import type { MessageService } from '../../services/MessageService.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = textTemplates.subtags.messageEditTime;

@Subtag.id('messageEditTime')
@Subtag.ctorArgs('channels', 'messages')
export class MessageEditTimeSubtag extends CompiledSubtag {
    readonly #channels: ChannelService;
    readonly #messages: MessageService;

    public constructor(channels: ChannelService, messages: MessageService) {
        super({
            category: SubtagType.MESSAGE,
            description: tag.description, //TODO Change this
            definition: [
                {
                    parameters: [],
                    returns: 'string',
                    execute: (ctx) => this.getMessageEditTime(ctx, ctx.runtime.channel.id, ctx.runtime.message.id, 'x')
                },
                {
                    parameters: ['format|messageid'],
                    returns: 'string',
                    execute: (context, [formatOrMessageId]) => {
                        if (snowflake.test(formatOrMessageId.value))
                            return this.getMessageEditTime(context, context.runtime.channel.id, formatOrMessageId.value, 'x');
                        return this.getMessageEditTime(context, context.runtime.channel.id, context.runtime.message.id, formatOrMessageId.value);
                    }
                },
                {
                    parameters: ['channel|messageid', 'messageid|format'],
                    returns: 'string',
                    execute: async (context, [channelOrMessageId, messageIdOrFormat]) => {
                        if (snowflake.test(messageIdOrFormat.value))
                            return await this.getMessageEditTime(context, channelOrMessageId.value, messageIdOrFormat.value, 'x');
                        return await this.getMessageEditTime(context, context.runtime.channel.id, channelOrMessageId.value, messageIdOrFormat.value);
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

        this.#channels = channels;
        this.#messages = messages;
    }

    public async getMessageEditTime(
        context: BBTagScript,
        channelStr: string,
        messageStr: string,
        format: string
    ): Promise<string> {
        const channel = await this.#channels.querySingle(context.runtime, channelStr, { noLookup: true }); //TODO lookup
        if (channel === undefined)
            throw new ChannelNotFoundError(channelStr);

        const message = await this.#messages.get(context.runtime, channel.id, messageStr);
        if (message === undefined)
            throw new MessageNotFoundError(channel.id, messageStr);

        return message.edited_timestamp === null
            ? moment().format(format)
            : moment(message.edited_timestamp).format(format);
    }
}
