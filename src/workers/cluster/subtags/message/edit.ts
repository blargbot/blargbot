import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { BBTagRuntimeError, ChannelNotFoundError, MessageNotFoundError } from '@cluster/bbtag/errors';
import { guard, parse, SubtagType } from '@cluster/utils';
import { EmbedFieldData, MessageEmbed, MessageEmbedOptions } from 'discord.js';

export class EditSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'edit',
            category: SubtagType.MESSAGE,
            desc: '`text` and `embed` can both be set to `_delete` to remove either the message content or embed.' +
                'Please note that `embed` is the JSON for an embed object or an array of embed objects, don\'t put `{embed}` there, as nothing will show. Only messages created by the bot may be edited.',
            definition: [//! Overwritten
                {
                    parameters: ['messageId', 'text|embed'],
                    execute: (ctx, args) => this.edit(ctx, ctx.channel.id, args[0].value, args[1].value)
                },
                {
                    parameters: ['messageId|channelId', 'messageId|text', '(text|embed)|(embed)'],
                    execute: async (ctx, args) => {
                        const channel = await ctx.queryChannel(args[0].value, { noLookup: true });
                        if (channel === undefined) {//{edit;msg;text;embed}
                            await this.edit(ctx, ctx.channel.id, args[0].value, args[1].value, args[2].value);
                        } else {//{edit;channel;msg;text|embed}
                            await this.edit(ctx, channel.id, args[1].value, args[2].value);
                        }
                    }
                },
                {
                    parameters: ['channelId', 'messageID', 'text', 'embed'],
                    execute: (ctx, args) => this.edit(ctx, args[0].value, args[1].value, args[2].value, args[3].value)
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
    ): Promise<string | void> {
        const channel = await context.queryChannel(channelStr, { noLookup: true });
        if (channel === undefined)
            throw new ChannelNotFoundError(channelStr);

        let content: string | undefined;
        let embeds: MessageEmbed[] | MessageEmbedOptions[] | undefined;
        if (embedStr !== undefined) {
            embeds = parse.embed(embedStr);
            content = contentStr;
        } else {
            const parsedEmbed = parse.embed(contentStr);
            if (parsedEmbed === undefined || guard.hasProperty(parsedEmbed, 'malformed')) {
                content = contentStr;
            } else {
                embeds = parsedEmbed;
            }
        }

        try {
            const message = await context.util.getMessage(channel.id, messageStr);

            if (message === undefined)
                throw new MessageNotFoundError(channel, messageStr);
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
                // NOOP
            }
        } catch (err: unknown) {
            throw new BBTagRuntimeError('Unable to get message');
        }
    }

    public enrichDocs(embed: MessageEmbedOptions): MessageEmbedOptions {
        const limitField = <EmbedFieldData>embed.fields?.pop();

        embed.fields = [
            {
                name: 'Usage',
                value: '```\n{edit;<messageID>;<text|embed>}```\n' +
                    'Edits `messageID` in the current channel to say `text` or `embed`.\n\n' +
                    '**Example code:**\n' +
                    '> {edit;111111111111111111;{embedbuild;title:Hello world}}\n**Example out:**\n' +
                    '> (the message got edited idk how to do examples for this)'
            },
            {
                name: '\u200b',
                value: '```\n{edit;<channelID>;<messageID>;<text|embed>}```\n' +
                    'Edits `messageID` in `channelID` to say `text` or `embed`.\n\n' +
                    '**Example code:**\n' +
                    '> {edit;111111111111111111;222222222222222222;Hello world}\n**Example out:**\n' +
                    '> (the message got edited idk how to do examples for this)'
            },
            {
                name: '\u200b',
                value: '```\n{edit;<messageID>;<text>;<embed>}```\n' +
                    'Edits `messageID` in the current channel to say `text` and `embed`.\n\n' +
                    '**Example code:**\n' +
                    '> {edit;111111111111111111;Hello world;{embedbuild;title:Foo bar}}\n**Example out:**\n' +
                    ' (the message got edited idk how to do examples for this)'
            },
            {
                name: '\u200b',
                value: '```\n{edit;<channelID>;<messageID>;<text>;<embed>}```\n' +
                    'Edits `messageID` in `channelID` to say `text` and `embed`.\n\n' +
                    '**Example code:**\n' +
                    '> {edit;111111111111111111;222222222222222222;Hello world;{embedbuild;title:Foo bar}}\n**Example out:**\n' +
                    '> (the message got edited idk how to do examples for this)'
            }
        ];
        embed.fields.push(limitField);
        return embed;
    }
}
