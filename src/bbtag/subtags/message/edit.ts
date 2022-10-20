import { guard, parse } from '@blargbot/core/utils';
import { EmbedOptions } from 'eris';

import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { BBTagRuntimeError, ChannelNotFoundError, MessageNotFoundError } from '../../errors';
import { SubtagType } from '../../utils';

export class EditSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'edit',
            category: SubtagType.MESSAGE,
            description: '`text` and `embed` can both be set to `_delete` to remove either the message content or embed.Please note that `embed` is the JSON for an embed object or an array of embed objects, don\'t put `{embed}` there, as nothing will show. Only messages created by the bot may be edited.',
            definition: [
                {
                    parameters: ['messageId', 'text|embed'],
                    returns: 'nothing',
                    description: 'Edits `messageID` in the current channel to say `text` or `embed`',
                    exampleCode: '{edit;111111111111111111;{embedbuild;title:Hello world}}',
                    exampleOut: '',
                    execute: (ctx, [messageId, content]) => this.edit(ctx, ctx.channel.id, messageId.value, content.value)
                },
                {
                    parameters: ['messageId', 'text', 'embed'],
                    description: 'Edits `messageID` in the current channel to say `text` and `embed`',
                    exampleCode: '{edit;111111111111111111;Hello world;{embedbuild;title:Foo bar}}',
                    exampleOut: ''
                },
                {
                    parameters: ['channel', 'messageId', 'text|embed'],
                    description: 'Edits `messageID` in `channelID` to say `text` or `embed`',
                    exampleCode: '{edit;111111111111111111;222222222222222222;Hello world}',
                    exampleOut: ''
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
                    description: 'Edits `messageID` in `channelID` to say `text` and `embed`',
                    exampleCode: '{edit;111111111111111111;222222222222222222;Hello world;{embedbuild;title:Foo bar}}',
                    exampleOut: '',
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
        let embeds: EmbedOptions[] | undefined;
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
