import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { SubtagCall } from '@cluster/types';
import { guard, parse, SubtagType } from '@cluster/utils';
import { EmbedFieldData, MessageEmbedOptions } from 'discord.js';

export class EditSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'edit',
            category: SubtagType.API,
            desc: '`text` and `embed` can both be set to `_delete` to remove either the message content or embed.' +
                'Please note that `embed` is the JSON for an embed object, don\'t put `{embed}` there, as nothing will show. Only messages created by the bot may be edited.',
            definition: [//! Overwritten
                {
                    parameters: ['messageId', 'text|embed'],
                    execute: (ctx, args, subtag) => this.edit(ctx, subtag, ctx.channel.id, args[0].value, args[1].value)
                },
                {
                    parameters: ['messageId|channelId', 'messageId|text', '(text|embed)|(embed)'],
                    execute: async (ctx, args, subtag) => {
                        const channel = await ctx.queryChannel(args[0].value, {noLookup: true});
                        if (channel === undefined) {//{edit;msg;text;embed}
                            await this.edit(ctx, subtag, ctx.channel.id, args[0].value, args[1].value, args[2].value);
                        } else {//{edit;channel;msg;text|embed}
                            await this.edit(ctx, subtag, channel.id, args[1].value, args[2].value);
                        }
                    }
                },
                {
                    parameters: ['channelId', 'messageID', 'text', 'embed'],
                    execute: (ctx, args, subtag) => this.edit(ctx, subtag, args[0].value, args[1].value, args[2].value, args[3].value)
                }
            ]
        });
    }

    public async edit(
        context: BBTagContext,
        subtag: SubtagCall,
        channelStr: string,
        messageStr: string,
        contentStr: string,
        embedStr?: string
    ): Promise<string | void> {
        const channel = await context.queryChannel(channelStr, {noLookup: true});
        if (channel === undefined)
            return this.channelNotFound(context, subtag);
        let content: string | undefined;
        let embed: MessageEmbedOptions | undefined;
        if (embedStr !== undefined) {
            embed = parse.embed(embedStr);
            content = contentStr;
        }else {
            const parsedEmbed = parse.embed(contentStr);
            if (parsedEmbed === undefined || guard.hasProperty(parsedEmbed, 'malformed')) {
                content = contentStr;
            } else {
                embed = parsedEmbed;
            }
        }

        try {
            const message = await context.util.getMessage(channel.id, messageStr);

            if (message === undefined)
                return this.noMessageFound(context, subtag);
            if (message.author.id !== context.discord.user.id)
                return this.customError('I must be the message author', context, subtag);
            content = content ?? message.content;
            let embeds = embed !== undefined ? [embed] : message.embeds;

            if (contentStr === '_delete') content = '';
            if (embedStr === '_delete') embeds = [];

            if (content.trim() === '' && embeds.length === 0)
                return this.customError('Message cannot be empty', context, subtag);
            try {
                await message.edit({
                    content,
                    embeds
                });
            } catch (err: unknown) {
                // NOOP
            }
        } catch (err: unknown) {
            return this.customError('Unable to get message', context, subtag);
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
