import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { ChannelNotFoundError, MessageNotFoundError } from '../../errors/index.js';
import { templates } from '../../text.js';
import { SubtagType } from '../../utils/index.js';
import { ChannelIdSubtag } from '../channel/channelId.js';

const tag = templates.subtags.messageSender;

export interface GetMessageAuthorFeature {
    getMessageAuthor(channelId: string, messageId: string): Promise<string | undefined>;
}

type Features = GetMessageAuthorFeature
export class MessageSenderSubtag extends CompiledSubtag {
    readonly #features: Features;
    public constructor(features: Features) {
        super({
            name: 'messageSender',
            category: SubtagType.MESSAGE,
            aliases: ['sender'],
            definition: [
                {
                    parameters: [],
                    description: tag.trigger.description,
                    exampleCode: tag.trigger.exampleCode,
                    exampleOut: tag.trigger.exampleOut,
                    returns: 'id',
                    execute: (ctx) => this.getMessageSender(ctx, ctx.local.message.channel.id, ctx.local.message.id, false)
                },
                {
                    parameters: ['messageid'],
                    description: tag.inCurrent.description,
                    exampleCode: tag.inCurrent.exampleCode,
                    exampleOut: tag.inCurrent.exampleOut,
                    returns: 'id',
                    execute: (ctx, [messageId]) => this.getMessageSender(ctx, ctx.local.message.channel.id, messageId.value, false)
                },
                {
                    parameters: ['channel', 'messageid', 'quiet?'],
                    description: tag.inOther.description,
                    exampleCode: tag.inOther.exampleCode,
                    exampleOut: tag.inOther.exampleOut,
                    returns: 'id',
                    execute: (ctx, [channel, message, quiet]) => this.getMessageSender(ctx, channel.value, message.value, quiet.value !== '')
                }
            ]
        });
        this.#features = features;
    }

    public async getMessageSender(
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

        return await this.#features.getMessageAuthor(channelId, messageId)
            ?? new MessageNotFoundError(channelId, messageId).withDisplay(quiet ? '' : undefined).throw();
    }
}
