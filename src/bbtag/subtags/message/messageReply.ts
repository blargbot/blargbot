import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { ChannelNotFoundError, MessageNotFoundError } from '../../errors/index.js';
import { templates } from '../../text.js';
import { SubtagType } from '../../utils/index.js';
import { ChannelIdSubtag } from '../channel/channelId.js';

const tag = templates.subtags.messageReply;

export interface GetMessageReplyTargetFeature {
    getMessageReplyTarget(channelId: string, messageId: string): Promise<string | null | undefined>;
}

type Features = GetMessageReplyTargetFeature
export class MessageReplySubtag extends CompiledSubtag {
    readonly #features: Features;
    public constructor(features: Features) {
        super({
            name: 'messageReply',
            category: SubtagType.MESSAGE,
            definition: [
                {
                    parameters: [],
                    description: tag.trigger.description,
                    exampleCode: tag.trigger.exampleCode,
                    exampleOut: tag.trigger.exampleOut,
                    returns: 'id',
                    execute: (ctx) => this.getMessageReplyId(ctx, ctx.local.message.channel.id, ctx.local.message.id, false)
                },
                {
                    parameters: ['messageid'],
                    description: tag.inCurrent.description,
                    exampleCode: tag.inCurrent.exampleCode,
                    exampleOut: tag.inCurrent.exampleOut,
                    returns: 'id',
                    execute: (ctx, [message]) => this.getMessageReplyId(ctx, ctx.local.message.channel.id, message.value, false)
                },
                {
                    parameters: ['channel', 'messageid', 'quiet?'],
                    description: tag.inOther.description,
                    exampleCode: tag.inOther.exampleCode,
                    exampleOut: tag.inOther.exampleOut,
                    returns: 'id',
                    execute: (ctx, [channel, message, quiet]) => this.getMessageReplyId(ctx, channel.value, message.value, quiet.value !== '')
                }
            ]
        });
        this.#features = features;
    }

    public async getMessageReplyId(context: BBTagContext, channelStr: string, messageId: string, quiet: boolean): Promise<string> {
        quiet ||= context.local.quiet ?? false;
        if (messageId === '')
            messageId = context.local.message.id;

        const channelId = await ChannelIdSubtag.query(context, channelStr, { noLookup: quiet })
            ?? new ChannelNotFoundError(channelStr).withDisplay(quiet ? '' : undefined).throw();

        const replyId = await this.#features.getMessageReplyTarget(channelId, messageId);
        if (replyId === undefined) {
            throw new MessageNotFoundError(channelId, messageId)
                .withDisplay(quiet ? '' : undefined);
        }

        return replyId ?? '';
    }
}
