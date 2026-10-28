import type * as BBTagContextJs from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { ChannelNotFoundError, MessageNotFoundError } from '../../errors/index.js';
import { templates } from '../../text.js';
import type { Embed } from '../../types.js';
import { SubtagType } from '../../utils/index.js';
import { ChannelIdSubtag } from '../channel/channelId.js';

const tag = templates.subtags.messageEmbeds;

export interface GetMessageEmbedsFeature {
    getMessageEmbeds(channelId: string, messageId: string): Promise<readonly Embed[] | undefined>;
}

type Features = GetMessageEmbedsFeature
export class MessageEmbedsSubtag extends CompiledSubtag {
    readonly #features: Features;
    public constructor(features: Features) {
        super({
            name: 'messageEmbeds',
            category: SubtagType.MESSAGE,
            definition: [
                {
                    parameters: [],
                    description: tag.trigger.description,
                    exampleCode: tag.trigger.exampleCode,
                    exampleOut: tag.trigger.exampleOut,
                    returns: 'embed[]',
                    execute: (ctx) => this.getMessageEmbeds(ctx, ctx.local.channelId, ctx.local.messageId, false)
                },
                {
                    parameters: ['messageid'],
                    description: tag.inCurrent.description,
                    exampleCode: tag.inCurrent.exampleCode,
                    exampleOut: tag.inCurrent.exampleOut,
                    returns: 'embed[]',
                    execute: (ctx, [messageId]) => this.getMessageEmbeds(ctx, ctx.local.channelId, messageId.value, false)
                },
                {
                    parameters: ['channel', 'messageid', 'quiet?'],
                    description: tag.inOther.description,
                    exampleCode: tag.inOther.exampleCode,
                    exampleOut: tag.inOther.exampleOut,
                    returns: 'embed[]',
                    execute: (ctx, [channel, message, quiet]) => this.getMessageEmbeds(ctx, channel.value, message.value, quiet.value !== '')
                }
            ]
        });
        this.#features = features;
    }

    public async getMessageEmbeds(
        context: BBTagContextJs.BBTagContext,
        channelStr: string,
        messageId: string,
        quiet: boolean
    ): Promise<readonly Embed[]> {
        quiet ||= context.local.quiet ?? false;
        if (messageId === '')
            messageId = context.local.messageId;

        const channelId = await ChannelIdSubtag.query(context, channelStr, { noLookup: quiet })
            ?? new ChannelNotFoundError(channelStr).withDisplay(quiet ? '[]' : undefined).throw();

        return await this.#features.getMessageEmbeds(channelId, messageId)
            ?? new MessageNotFoundError(channelId, messageId).withDisplay(quiet ? '[]' : undefined).throw();

    }
}
