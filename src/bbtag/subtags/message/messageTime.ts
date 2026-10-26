import { snowflake } from '@blargbot/core';
import moment from 'moment-timezone';

import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { ChannelNotFoundError, MessageNotFoundError } from '../../errors/index.js';
import { templates } from '../../text.js';
import { SubtagType } from '../../utils/index.js';
import { ChannelIdSubtag } from '../channel/channelId.js';

const tag = templates.subtags.messageTime;

export interface GetMessageTimestampFeature {
    getMessageTimestamp(channelId: string, messageId: string): Promise<Temporal.Instant | undefined>;
}

type Features = GetMessageTimestampFeature
export class MessageTimeSubtag extends CompiledSubtag {
    readonly #features: Features;
    public constructor(features: Features) {
        super({
            name: 'messageTime',
            category: SubtagType.MESSAGE,
            aliases: ['timestamp'],
            definition: [
                {
                    parameters: [],
                    returns: 'string',
                    execute: (ctx) => this.getMessageTime(ctx, ctx.local.message.channel.id, ctx.local.message.id, 'x')
                },
                {
                    parameters: ['format|messageid'],
                    returns: 'string',
                    execute: (context, [formatOrMessageId]) => {
                        if (snowflake.test(formatOrMessageId.value))
                            return this.getMessageTime(context, context.local.message.channel.id, formatOrMessageId.value, 'x');
                        return this.getMessageTime(context, context.local.message.channel.id, context.local.message.id, formatOrMessageId.value);
                    }
                },
                {
                    parameters: ['channel|messageid', 'messageid|format'],
                    returns: 'string',
                    execute: async (context, [channelOrMessageId, messageIdOrFormat]) => {
                        if (snowflake.test(messageIdOrFormat.value))
                            return await this.getMessageTime(context, channelOrMessageId.value, messageIdOrFormat.value, 'x');
                        return await this.getMessageTime(context, context.local.message.channel.id, channelOrMessageId.value, messageIdOrFormat.value);
                    }
                },
                {
                    parameters: ['channel', 'messageid', 'format:x'],
                    returns: 'string',
                    execute: (context, [channel, message, format]) => this.getMessageTime(context, channel.value, message.value, format.value)
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
        this.#features = features;
    }

    public async getMessageTime(
        context: BBTagContext,
        channelStr: string,
        messageId: string,
        format: string
    ): Promise<string> {
        if (messageId === '')
            messageId = context.local.message.id;

        const channelId = await ChannelIdSubtag.query(context, channelStr, { noLookup: true }) //TODO lookup
            ?? new ChannelNotFoundError(channelStr).throw();

        const timestamp = await this.#features.getMessageTimestamp(channelId, messageId)
            ?? new MessageNotFoundError(channelId, messageId).throw();

        return moment(timestamp.epochMilliseconds).format(format);
    }
}
