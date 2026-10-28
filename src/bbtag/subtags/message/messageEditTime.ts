import moment from 'moment-timezone';

import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { ChannelNotFoundError, MessageNotFoundError } from '../../errors/index.js';
import { templates } from '../../text.js';
import { SubtagType } from '../../utils/index.js';
import { isSnowflake } from '../../utils/snowflake.js';
import { ChannelIdSubtag } from '../channel/channelId.js';

const tag = templates.subtags.messageEditTime;

export interface GetMessageEditTimestampFeature {
    getMessageEditTimestamp(channelId: string, messageId: string): Promise<Temporal.Instant | null | undefined>;
}

type Features = GetMessageEditTimestampFeature
export class MessageEditTimeSubtag extends CompiledSubtag {
    readonly #features: Features;
    public constructor(features: Features) {
        super({
            name: 'messageEditTime',
            category: SubtagType.MESSAGE,
            description: tag.description, //TODO Change this
            definition: [
                {
                    parameters: [],
                    returns: 'string',
                    execute: (ctx) => this.getMessageEditTime(ctx, ctx.local.channelId, ctx.local.messageId, 'x')
                },
                {
                    parameters: ['format|messageid'],
                    returns: 'string',
                    execute: (context, [formatOrMessageId]) => {
                        if (isSnowflake(formatOrMessageId.value))
                            return this.getMessageEditTime(context, context.local.channelId, formatOrMessageId.value, 'x');
                        return this.getMessageEditTime(context, context.local.channelId, context.local.messageId, formatOrMessageId.value);
                    }
                },
                {
                    parameters: ['channel|messageid', 'messageid|format'],
                    returns: 'string',
                    execute: async (context, [channelOrMessageId, messageIdOrFormat]) => {
                        if (isSnowflake(messageIdOrFormat.value))
                            return await this.getMessageEditTime(context, channelOrMessageId.value, messageIdOrFormat.value, 'x');
                        return await this.getMessageEditTime(context, context.local.channelId, channelOrMessageId.value, messageIdOrFormat.value);
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
        this.#features = features;
    }

    public async getMessageEditTime(
        context: BBTagContext,
        channelStr: string,
        messageId: string,
        format: string
    ): Promise<string> {
        if (messageId === '')
            messageId = context.local.messageId;

        const channelId = await ChannelIdSubtag.query(context, channelStr, { noLookup: true }) //TODO lookup
            ?? new ChannelNotFoundError(channelStr).throw();

        const editTime = await this.#features.getMessageEditTimestamp(channelId, messageId);
        if (editTime === undefined)
            throw new MessageNotFoundError(channelId, messageId);

        const result = editTime ?? Temporal.Now.instant();
        return moment(result.epochMilliseconds).format(format);
    }
}
