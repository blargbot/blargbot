import { snowflake } from '@blargbot/core';
import moment from 'moment-timezone';

import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { ChannelNotFoundError, MessageNotFoundError } from '../../errors/index.js';
import { templates } from '../../text.js';
import { SubtagType } from '../../utils/index.js';
import { ChannelIdSubtag } from '../channel/channelId.js';

const tag = templates.subtags.messageEditTime;

export interface GetMessageEditTimeThunk {
    (channelId: string, messageId: string): Promise<Temporal.Instant | null | undefined>;
}

export class MessageEditTimeSubtag extends CompiledSubtag {
    readonly #getMessageEditTime: GetMessageEditTimeThunk;
    public constructor({ getMessageEditTime }: { getMessageEditTime: GetMessageEditTimeThunk; }) {
        super({
            name: 'messageEditTime',
            category: SubtagType.MESSAGE,
            description: tag.description, //TODO Change this
            definition: [
                {
                    parameters: [],
                    returns: 'string',
                    execute: (ctx) => this.getMessageEditTime(ctx, ctx.local.message.channel.id, ctx.local.message.id, 'x')
                },
                {
                    parameters: ['format|messageid'],
                    returns: 'string',
                    execute: (context, [formatOrMessageId]) => {
                        if (snowflake.test(formatOrMessageId.value))
                            return this.getMessageEditTime(context, context.local.message.channel.id, formatOrMessageId.value, 'x');
                        return this.getMessageEditTime(context, context.local.message.channel.id, context.local.message.id, formatOrMessageId.value);
                    }
                },
                {
                    parameters: ['channel|messageid', 'messageid|format'],
                    returns: 'string',
                    execute: async (context, [channelOrMessageId, messageIdOrFormat]) => {
                        if (snowflake.test(messageIdOrFormat.value))
                            return await this.getMessageEditTime(context, channelOrMessageId.value, messageIdOrFormat.value, 'x');
                        return await this.getMessageEditTime(context, context.local.message.channel.id, channelOrMessageId.value, messageIdOrFormat.value);
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
        this.#getMessageEditTime = getMessageEditTime;
    }

    public async getMessageEditTime(
        context: BBTagContext,
        channelStr: string,
        messageId: string,
        format: string
    ): Promise<string> {
        if (messageId === '')
            messageId = context.local.message.id;

        const channelId = await ChannelIdSubtag.query(context, channelStr, { noLookup: true }) //TODO lookup
            ?? new ChannelNotFoundError(channelStr).throw();

        const editTime = await this.#getMessageEditTime(channelId, messageId);
        if (editTime === undefined)
            throw new MessageNotFoundError(channelId, messageId);

        const result = editTime ?? Temporal.Now.instant();
        return moment(result.epochMilliseconds).format(format);
    }
}
