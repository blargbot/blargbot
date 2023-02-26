import type Discord from '@blargbot/discord-types';

import type { BBTagContext } from '../../BBTagContext.js';
import type { BBTagValueConverter } from '../../BBTagUtilities.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError, ChannelNotFoundError, MessageNotFoundError } from '../../errors/index.js';
import type { ChannelService } from '../../services/ChannelService.js';
import type { MessageService } from '../../services/MessageService.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = textTemplates.subtags.edit;

@Subtag.names('edit')
@Subtag.ctorArgs(Subtag.converter(), Subtag.service('channel'), Subtag.service('message'))
export class EditSubtag extends CompiledSubtag {
    readonly #converter: BBTagValueConverter;
    readonly #channels: ChannelService;
    readonly #messages: MessageService;

    public constructor(converter: BBTagValueConverter, channels: ChannelService, messages: MessageService) {
        super({
            category: SubtagType.MESSAGE,
            description: tag.description,
            definition: [
                {
                    parameters: ['messageId', 'text'],
                    description: tag.inCurrentText.description,
                    exampleCode: tag.inCurrentText.exampleCode,
                    exampleOut: tag.inCurrentText.exampleOut
                },
                {
                    parameters: ['messageId', 'embed'],
                    description: tag.inCurrentEmbed.description,
                    exampleCode: tag.inCurrentEmbed.exampleCode,
                    exampleOut: tag.inCurrentEmbed.exampleOut
                },
                {
                    parameters: ['messageId', 'text|embed'],
                    returns: 'nothing',
                    execute: (ctx, [messageId, content]) => this.edit(ctx, ctx.channel.id, messageId.value, content.value)
                },
                {
                    parameters: ['messageId', 'text', 'embed'],
                    description: tag.inCurrentFull.description,
                    exampleCode: tag.inCurrentFull.exampleCode,
                    exampleOut: tag.inCurrentFull.exampleOut
                },
                {
                    parameters: ['channel', 'messageId', 'text'],
                    description: tag.inOtherText.description,
                    exampleCode: tag.inOtherText.exampleCode,
                    exampleOut: tag.inOtherText.exampleOut
                },
                {
                    parameters: ['channel', 'messageId', 'embed'],
                    description: tag.inOtherEmbed.description,
                    exampleCode: tag.inOtherEmbed.exampleCode,
                    exampleOut: tag.inOtherEmbed.exampleOut
                },
                {
                    parameters: ['messageId|channelId', 'messageId|text', '(text|embed)|(embed)'],
                    returns: 'nothing',
                    execute: async (ctx, [chanOrMessage, messageOrText, content]) => {
                        const channel = await this.#channels.querySingle(ctx, chanOrMessage.value, { noLookup: true });
                        if (channel === undefined)
                            //{edit;msg;text;embed}
                            return await this.edit(ctx, ctx.channel.id, chanOrMessage.value, messageOrText.value, content.value);

                        //{edit;channel;msg;text|embed}
                        return await this.edit(ctx, channel.id, messageOrText.value, content.value);

                    }
                },
                {
                    parameters: ['channel', 'messageID', 'text', 'embed'],
                    returns: 'nothing',
                    description: tag.inOtherFull.description,
                    exampleCode: tag.inOtherFull.exampleCode,
                    exampleOut: tag.inOtherFull.exampleOut,
                    execute: (ctx, [channelId, messageId, text, embed]) => this.edit(ctx, channelId.value, messageId.value, text.value, embed.value)
                }
            ]
        });

        this.#converter = converter;
        this.#channels = channels;
        this.#messages = messages;
    }

    public async edit(
        context: BBTagContext,
        channelStr: string,
        messageStr: string,
        contentStr: string,
        embedStr?: string
    ): Promise<void> {
        const channel = await this.#channels.querySingle(context, channelStr, { noLookup: true });
        if (channel === undefined)
            throw new ChannelNotFoundError(channelStr);

        let content: string | undefined;
        let embeds: Discord.APIEmbed[] | undefined;
        if (embedStr !== undefined) {
            embeds = this.#converter.embed(embedStr, { allowMalformed: true });
            content = contentStr;
        } else {
            const parsedEmbed = this.#converter.embed(contentStr);
            if (parsedEmbed === undefined) {
                content = contentStr;
            } else {
                embeds = parsedEmbed;
            }
        }

        const message = await this.#messages.get(context, channel.id, messageStr);
        if (message === undefined)
            throw new MessageNotFoundError(channel.id, messageStr);
        if (message.author.id !== context.bot.id)
            throw new BBTagRuntimeError('I must be the message author');

        content = content ?? message.content;
        embeds = embeds ?? message.embeds;

        if (contentStr === '_delete') content = '';
        if (embedStr === '_delete') embeds = [];

        if (content.trim() === '' && embeds.length === 0)
            throw new BBTagRuntimeError('Message cannot be empty');

        await this.#messages.edit(context, channel.id, message.id, { content, embeds });
    }
}
