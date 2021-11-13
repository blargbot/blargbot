import { BBTagContext, Subtag } from '@cluster/bbtag';
import { ChannelNotFoundError, MessageNotFoundError } from '@cluster/bbtag/errors';
import { SubtagType } from '@cluster/utils';
import { MessageEmbedOptions } from 'discord.js';
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
                    execute: (ctx) => ctx.message.createdTimestamp.toString()
                },
                {
                    parameters: ['format|messageid'],
                    description: 'If the first argument is a messageid, this will return the send time of `messageid` in unix. ' +
                        'Else this will return the send time of the executing message in `format`.',
                    returns: 'string',
                    execute: (context, args) => {
                        if (/^\d{17,23}/.test(args[0].value))
                            return this.getMessageTime(context, context.channel.id, args[0].value, 'x');
                        return this.getMessageTime(context, context.channel.id, context.message.id, args[0].value);
                    }
                },
                {
                    parameters: ['channel|messageid', 'messageid|format'],
                    description: '{messagetime;<channel>;<messageid>} or {messagetime;<messagetime;<format>}',
                    returns: 'string',
                    execute: async (context, args) => {
                        const channel = await context.queryChannel(args[0].value, { noErrors: true });
                        if (channel === undefined)
                            return this.getMessageTime(context, context.channel.id, args[0].value, args[1].value);
                        return this.getMessageTime(context, args[0].value, args[1].value, 'x');
                    }
                },
                {
                    parameters: ['channel', 'messageid', 'format'],
                    description: '{messagetime;<channel>;<messageid>;<format>}',
                    returns: 'string',
                    execute: (context, args) => this.getMessageTime(context, args[0].value, args[1].value, args[2].value)
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
            return moment(message.createdTimestamp).format(format);
        } catch (e: unknown) {
            throw new MessageNotFoundError(channel, messageStr);
        }
    }

    public enrichDocs(embed: MessageEmbedOptions): MessageEmbedOptions {
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
                '**Example code:**\n> Message 11111111111111 was sent at {messagetime;11111111111111;HH:mm}\n' +
                '**Example out:**\n> Message 11111111111111 was sent at 18:06'
        },
        {
            name: '\u200b',
            value: '```{messagetime;<channel>;<messageid>;[format]}```' +
                '`format` defaults to `x`\n\n' +
                'Returns the send time of `messageid` from `channel` in `format`.\n\n' +
                '**Example code:**\n> Message 11111111111111 in #support was sent at {messagetime;support;11111111111111;HH:mm}\n' +
                '**Example out:**\n> Message 11111111111111 in #support was sent at 18:09'
        }];
        return embed;
    }
}
