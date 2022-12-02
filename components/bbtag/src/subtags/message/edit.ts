import { guard, parse } from '@blargbot/core/utils/index.js';
import Eris from 'eris';

import { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError, ChannelNotFoundError, MessageNotFoundError } from '../../errors/index.js';
import templates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = templates.subtags.edit;

export class EditSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'edit',
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
                        const channel = await ctx.queryChannel(chanOrMessage.value, { noLookup: true });
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
    }

    public async edit(
        context: BBTagContext,
        channelStr: string,
        messageStr: string,
        contentStr: string,
        embedStr?: string
    ): Promise<void> {
        const channel = await context.queryChannel(channelStr, { noLookup: true });
        if (channel === undefined)
            throw new ChannelNotFoundError(channelStr);

        let content: string | undefined;
        let embeds: Eris.EmbedOptions[] | undefined;
        if (embedStr !== undefined) {
            embeds = parse.embed(embedStr);
            content = contentStr;
        } else {
            const parsedEmbed = parse.embed(contentStr);
            if (parsedEmbed === undefined || parsedEmbed.some(e => guard.hasProperty(e, 'malformed'))) {
                content = contentStr;
            } else {
                embeds = parsedEmbed;
            }
        }

        const message = await context.getMessage(channel, messageStr);
        if (message === undefined)
            throw new MessageNotFoundError(channel.id, messageStr);
        if (message.author.id !== context.discord.user.id)
            throw new BBTagRuntimeError('I must be the message author');

        content = content ?? message.content;
        embeds = embeds ?? message.embeds;

        if (contentStr === '_delete') content = '';
        if (embedStr === '_delete') embeds = [];

        if (content.trim() === '' && embeds.length === 0)
            throw new BBTagRuntimeError('Message cannot be empty');

        try {
            await message.edit({
                content,
                embeds
            });
        } catch (err: unknown) {
            context.logger.error('Failed to edit message', err);
        }
    }
}
