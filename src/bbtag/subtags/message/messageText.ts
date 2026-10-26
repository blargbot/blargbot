import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { ChannelNotFoundError, MessageNotFoundError } from '../../errors/index.js';
import { templates } from '../../text.js';
import { SubtagType } from '../../utils/index.js';
import { ChannelIdSubtag } from '../channel/channelId.js';

const tag = templates.subtags.messageText;

export interface GetMessageContentFeature {
    getMessageContent(channelId: string, messageId: string): Promise<string | undefined>;
}

type Features = GetMessageContentFeature
export class MessageTextSubtag extends CompiledSubtag {
    readonly #features: Features;
    public constructor(features: Features) {
        super({
            name: 'messageText',
            category: SubtagType.MESSAGE,
            aliases: ['text'],
            definition: [
                {
                    parameters: [],
                    description: tag.trigger.description,
                    exampleCode: tag.trigger.exampleCode,
                    exampleOut: tag.trigger.exampleOut,
                    returns: 'string',
                    execute: (ctx) => this.getMessageText(ctx, ctx.local.message.channel.id, ctx.local.message.id, false)
                },
                {
                    parameters: ['messageid'],
                    description: tag.inCurrent.description,
                    exampleCode: tag.inCurrent.exampleCode,
                    exampleOut: tag.inCurrent.exampleOut,
                    returns: 'string',
                    execute: (ctx, [messageId]) => this.getMessageText(ctx, ctx.local.message.channel.id, messageId.value, false)
                },
                {
                    parameters: ['channel', 'messageid', 'quiet?'],
                    description: tag.inOther.description,
                    exampleCode: tag.inOther.exampleCode,
                    exampleOut: tag.inOther.exampleOut,
                    returns: 'string',
                    execute: (ctx, [channel, messageId, quiet]) => this.getMessageText(ctx, channel.value, messageId.value, quiet.value !== '')
                }
            ]
        });
        this.#features = features;
    }

    public async getMessageText(
        context: BBTagContext,
        channelStr: string,
        messageId: string,
        quiet: boolean
    ): Promise<string> {
        quiet ||= context.local.quiet ?? false;
        if (messageId === '')
            messageId = context.local.message.id;

        const channelId = await ChannelIdSubtag.query(context, channelStr, { noLookup: quiet })
            ?? new ChannelNotFoundError(channelStr).withDisplay(quiet ? '' : undefined).throw();

        return await this.#features.getMessageContent(channelId, messageId)
            ?? new MessageNotFoundError(channelId, messageId).withDisplay(quiet ? '' : undefined).throw();

    }
}
