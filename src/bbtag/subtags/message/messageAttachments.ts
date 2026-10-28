import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { ChannelNotFoundError, MessageNotFoundError } from '../../errors/index.js';
import { templates } from '../../text.js';
import { SubtagType } from '../../utils/index.js';
import { ChannelIdSubtag } from '../channel/channelId.js';

const tag = templates.subtags.messageAttachments;

export interface GetMessageAttachmentUrlsFeature {
    getMessageAttachmentUrls(channelId: string, messageId: string): Promise<readonly URL[] | undefined>;
}

type Features = GetMessageAttachmentUrlsFeature
export class MessageAttachmentsSubtag extends CompiledSubtag {
    readonly #features: Features;
    public constructor(features: Features) {
        super({
            name: 'messageAttachments',
            category: SubtagType.MESSAGE,
            aliases: ['attachments'],
            definition: [
                {
                    parameters: [],
                    description: tag.trigger.description,
                    exampleCode: tag.trigger.exampleCode,
                    exampleOut: tag.trigger.exampleOut,
                    returns: 'string[]',
                    execute: (ctx) => this.getMessageAttachments(ctx, ctx.local.channelId, ctx.local.messageId, false)
                },
                {
                    parameters: ['messageid'],
                    description: tag.inCurrent.description,
                    exampleCode: tag.inCurrent.exampleCode,
                    exampleOut: tag.inCurrent.exampleOut,
                    returns: 'string[]',
                    execute: (ctx, [messageId]) => this.getMessageAttachments(ctx, ctx.local.channelId, messageId.value, false)
                },
                {
                    parameters: ['channel', 'messageid', 'quiet?'],
                    description: tag.inOther.description,
                    exampleCode: tag.inOther.exampleCode,
                    exampleOut: tag.inOther.exampleOut,
                    returns: 'string[]',
                    execute: (ctx, [channel, message, quiet]) => this.getMessageAttachments(ctx, channel.value, message.value, quiet.value !== '')
                }
            ]
        });
        this.#features = features;
    }

    public async getMessageAttachments(
        context: BBTagContext,
        channelStr: string,
        messageId: string,
        quiet: boolean
    ): Promise<string[]> {
        quiet ||= context.local.quiet ?? false;
        if (messageId === '')
            messageId = context.local.messageId;

        const channelId = await ChannelIdSubtag.query(context, channelStr, { noLookup: quiet })
            ?? new ChannelNotFoundError(channelStr).withDisplay(quiet ? '[]' : undefined).throw();

        const attachments = await this.#features.getMessageAttachmentUrls(channelId, messageId)
            ?? new MessageNotFoundError(channelId, messageId).withDisplay(quiet ? '[]' : undefined).throw();

        return attachments.map(x => x.toString());
    }
}
