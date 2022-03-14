import { BBTagContext, DefinedSubtag } from '@blargbot/cluster/bbtag';
import { ChannelNotFoundError, MessageNotFoundError } from '@blargbot/cluster/bbtag/errors';
import { snowflake, SubtagType } from '@blargbot/cluster/utils';
import { EmbedOptions } from 'eris';
import moment from 'moment';

export class MessageEditTimeSubtag extends DefinedSubtag {
    public constructor() {
        super({
            name: 'messageedittime',
            category: SubtagType.MESSAGE,
            desc: 'If the message is not edited, this will return the current time instead.\n\n**Note:** there are plans to change this behaviour, but due to backwards-compatibility this remains unchanged.', //TODO Change this
            definition: [//!Overwritten
                {
                    parameters: [],
                    description: 'Returns the edit time of the executing message in unix milliseconds.',
                    exampleCode: 'The edit timestamp of your message is "{messageedittime}"',
                    exampleOut: 'The edit timestamp of your message is "1628782144703"',
                    returns: 'string',
                    execute: (ctx) => this.getMessageEditTime(ctx, ctx.channel.id, ctx.message.id, 'x')
                },
                {
                    parameters: ['format|messageid'],
                    description: 'If the first argument is a messageid, this will return the edit time of `messageid` in unix. ' +
                        'Else this will return the edit time of the executing message in `format`.',
                    returns: 'string',
                    execute: (context, [formatOrMessageId]) => {
                        if (snowflake.test(formatOrMessageId.value))
                            return this.getMessageEditTime(context, context.channel.id, formatOrMessageId.value, 'x');
                        return this.getMessageEditTime(context, context.channel.id, context.message.id, formatOrMessageId.value);
                    }
                },
                {
                    parameters: ['channel|messageid', 'messageid|format'],
                    description: '{messagetime;<channel>;<messageid>} or {messagetime;<messagetime;<format>}',
                    returns: 'string',
                    execute: async (context, [channelOrMessageId, messageIdOrFormat]) => {
                        if (snowflake.test(messageIdOrFormat.value))
                            return await this.getMessageEditTime(context, channelOrMessageId.value, messageIdOrFormat.value, 'x');
                        return await this.getMessageEditTime(context, context.channel.id, channelOrMessageId.value, messageIdOrFormat.value);
                    }
                },
                {
                    parameters: ['channel', 'messageid', 'format'],
                    description: '{messagetime;<channel>;<messageid>;<format>}',
                    returns: 'string',
                    execute: (context, [channel, message, format]) => this.getMessageEditTime(context, channel.value, message.value, format.value)
                }
            ]
        });
    }

    public async getMessageEditTime(
        context: BBTagContext,
        channelStr: string,
        messageStr: string,
        format: string
    ): Promise<string> {
        const channel = await context.queryChannel(channelStr, { noLookup: true }); //TODO lookup
        if (channel === undefined)
            throw new ChannelNotFoundError(channelStr);

        const message = await context.util.getMessage(channel, messageStr);
        if (message === undefined)
            throw new MessageNotFoundError(channel.id, messageStr);

        return message.editedTimestamp === undefined
            ? moment().format(format)
            : moment(message.editedTimestamp).format(format);
    }

    public enrichDocs(embed: EmbedOptions): EmbedOptions {
        embed.fields = [{
            name: '**Usage**',
            value: '```{messageedittime}```Returns the edit time of the executing message in unix milliseconds.' +
                '**Example code:**\n> The edit timestamp of your message is "{messageedittime}"\n**Example out:**\n> The -*edit timestamp of your message is "1628782144703"'
        },
        {
            name: '\u200b',
            value: '```{messageedittime;<format|messageid>}```' +
                'If the first argument is a messageid, this will return the edit time of `messageid` in unix. ' +
                'Else this will return the edit time of the executing message in `format`.\n\n' +
                '**Example code:**\n> Your message was edited on "{messageedittime;DD/MM/YYYY}"\n> The edit timestamp of message 11111111111111 is "{timestamp;11111111111111}"\n' +
                '**Example out:**\n> Your message was edited on "12/08/2021"\n> ' +
                'The edit timestamp of message 11111111111111 is "1628782180559"'
        },
        {
            name: '\u200b',
            value: '```{messageedittime;<messageid>;[format]}```' +
                '`format` defaults to `x` if left empty or omitted\n\n' +
                'Returns the edit time of `messageid` in `format`.\n\n' +
                '**Example code:**\n> KnownMessage 11111111111111 was edited at {messagetime;11111111111111;HH:mm}\n' +
                '**Example out:**\n> KnownMessage 11111111111111 was edited at 18:06'
        },
        {
            name: '\u200b',
            value: '```{messageedittime;<channel>;<messageid>;[format]}```' +
                '`format` defaults to `x`\n\n' +
                'Returns the edit time of `messageid` from `channel` in `format`.\n\n' +
                '**Example code:**\n> KnownMessage 11111111111111 in #support was edited at {messageedittime;support;11111111111111;HH:mm}\n' +
                '**Example out:**\n> KnownMessage 11111111111111 in #support was edited at 18:09'
        }];
        return embed;
    }
}
