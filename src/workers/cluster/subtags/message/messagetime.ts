import { BBTagContext, Subtag } from '@cluster/bbtag';
import { ChannelNotFoundError, MessageNotFoundError } from '@cluster/bbtag/errors';
import { SubtagType } from '@cluster/utils';
import { EmbedOptions } from 'eris';
import moment from 'moment';

export class MessageTimeSubtag extends Subtag {
    public constructor() {
        super({
            name: 'messagetime',
            category: SubtagType.MESSAGE,
            aliases: ['timestamp'],
            definition: [//! overwritten
                {
                    parameters: [],
                    description: 'Returns the send time of the executing message in unix milliseconds.',
                    exampleCode: 'The timestamp of your message is "{timestamp}"',
                    exampleOut: 'The timestamp of your message is "1628782144703"',
                    returns: 'string',
                    execute: (ctx) => this.getMessageTime(ctx, ctx.channel.id, ctx.message.id, 'x')
                },
                {
                    parameters: ['format|messageid'],
                    description: 'If the first argument is a messageid, this will return the send time of `messageid` in unix. ' +
                        'Else this will return the send time of the executing message in `format`.',
                    returns: 'string',
                    execute: (context, [formatOrMessage]) => {
                        if (/^\d{17,23}/.test(formatOrMessage.value))
                            return this.getMessageTime(context, context.channel.id, formatOrMessage.value, 'x');
                        return this.getMessageTime(context, context.channel.id, context.message.id, formatOrMessage.value);
                    }
                },
                {
                    parameters: ['channel|messageid', 'messageid|format'],
                    description: '{messagetime;<channel>;<messageid>} or {messagetime;<messagetime;<format>}',
                    returns: 'string',
                    execute: async (context, [channelOrMessage, messageOrFormat]) => {
                        const channel = await context.queryChannel(channelOrMessage.value, { noErrors: true });
                        if (channel === undefined)
                            return this.getMessageTime(context, context.channel.id, channelOrMessage.value, messageOrFormat.value);
                        return this.getMessageTime(context, channelOrMessage.value, messageOrFormat.value, 'x');
                    }
                },
                {
                    parameters: ['channel', 'messageid', 'format'],
                    description: '{messagetime;<channel>;<messageid>;<format>}',
                    returns: 'string',
                    execute: (context, [channel, message, format]) => this.getMessageTime(context, channel.value, message.value, format.value)
                }
            ]
        });
    }

    public async getMessageTime(
        context: BBTagContext,
        channelStr: string,
        messageStr: string,
        format: string
    ): Promise<string> {
        const channel = await context.queryChannel(channelStr, { noLookup: true }); //TODO lookup
        if (channel === undefined)
            throw new ChannelNotFoundError(channelStr);

        try {
            const message = await context.util.getMessage(channel.id, messageStr);
            if (message === undefined)
                throw new MessageNotFoundError(channel, messageStr);
            return moment(message.timestamp).format(format);
        } catch (e: unknown) {
            throw new MessageNotFoundError(channel, messageStr);
        }
    }

    public enrichDocs(embed: EmbedOptions): EmbedOptions {
        embed.fields = [{
            name: '**Usage**',
            value: '```{messagetime}```Returns the send time of the executing message in unix milliseconds.\n\n' +
                '**Example code:**\n> The timestamp of your message is "{timestamp}"\n**Example out:**\n> The timestamp of your message is "1628782144703"'
        },
        {
            name: '\u200b',
            value: '```{messagetime;<format|messageid>}```' +
                'If the first argument is a messageid, this will return the send time of `messageid` in unix. ' +
                'Else this will return the send time of the executing message in `format`.\n\n' +
                '**Example code:**\n> Your message was sent on "{timestamp;DD/MM/YYYY}"\n> The timestamp of message 11111111111111 is "{timestamp;11111111111111}"\n' +
                '**Example out:**\n> Your message was sent on "12/08/2021"\n> ' +
                'The timestamp of message 11111111111111 is "1628782180559"'
        },
        {
            name: '\u200b',
            value: '```{messagetime;<messageid>;[format]}```' +
                '`format` defaults to `x` if left empty or omitted\n\n' +
                'Returns the send time of `messageid` in `format`.\n\n' +
                '**Example code:**\n> KnownMessage 11111111111111 was sent at {messagetime;11111111111111;HH:mm}\n' +
                '**Example out:**\n> KnownMessage 11111111111111 was sent at 18:06'
        },
        {
            name: '\u200b',
            value: '```{messagetime;<channel>;<messageid>;[format]}```' +
                '`format` defaults to `x`\n\n' +
                'Returns the send time of `messageid` from `channel` in `format`.\n\n' +
                '**Example code:**\n> KnownMessage 11111111111111 in #support was sent at {messagetime;support;11111111111111;HH:mm}\n' +
                '**Example out:**\n> KnownMessage 11111111111111 in #support was sent at 18:09'
        }];
        return embed;
    }
}
