import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { ChannelNotFoundError, MessageNotFoundError } from '@cluster/bbtag/errors';
import { SubtagType } from '@cluster/utils';
import { MessageEmbedOptions } from 'discord.js';
import moment from 'moment';

export class MessageEditTimeSubtag extends BaseSubtag {
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
                    execute: async (context) => {
                        try {
                            const message = await context.util.getMessage(context.channel, context.message.id);
                            if (message === undefined)
                                throw new MessageNotFoundError(context.channel, context.message.id);
                            return message.editedTimestamp !== null ? moment(message.editedTimestamp).format('x') : moment().format('x');
                        } catch (e: unknown) {
                            throw new MessageNotFoundError(context.channel, context.message.id);
                        }
                    }
                },
                {
                    parameters: ['format|messageid'],
                    description: 'If the first argument is a messageid, this will return the edit time of `messageid` in unix. ' +
                        'Else this will return the edit time of the executing message in `format`.',
                    execute: (context, args) => {
                        if (/^\d{17,23}/.test(args[0].value))
                            return this.getMessageEditTime(context, context.channel.id, args[0].value, 'x');
                        return this.getMessageEditTime(context, context.channel.id, context.message.id, args[0].value);
                    }
                },
                {
                    parameters: ['channel|messageid', 'messageid|format'],
                    description: '{messagetime;<channel>;<messageid>} or {messagetime;<messagetime;<format>}',
                    execute: async (context, args) => {
                        const channel = await context.queryChannel(args[0].value, { noErrors: true });
                        if (channel === undefined)
                            return this.getMessageEditTime(context, context.channel.id, args[0].value, args[1].value);
                        return this.getMessageEditTime(context, args[0].value, args[1].value, 'x');
                    }
                },
                {
                    parameters: ['channel', 'messageid', 'format'],
                    description: '{messagetime;<channel>;<messageid>;<format>}',
                    execute: (context, args) => this.getMessageEditTime(context, args[0].value, args[1].value, args[2].value)
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

        try {
            const message = await context.util.getMessage(channel.id, messageStr);
            if (message === undefined)
                throw new MessageNotFoundError(channel, messageStr);

            return message.editedTimestamp === null ? moment().format('x') : moment(message.editedTimestamp).format(format);
        } catch (e: unknown) {
            throw new MessageNotFoundError(channel, messageStr);
        }
    }

    public enrichDocs(embed: MessageEmbedOptions): MessageEmbedOptions {
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
                '**Example code:**\n> Message 11111111111111 was edited at {messagetime;11111111111111;HH:mm}\n' +
                '**Example out:**\n> Message 11111111111111 was edited at 18:06'
        },
        {
            name: '\u200b',
            value: '```{messageedittime;<channel>;<messageid>;[format]}```' +
                '`format` defaults to `x`\n\n' +
                'Returns the edit time of `messageid` from `channel` in `format`.\n\n' +
                '**Example code:**\n> Message 11111111111111 in #support was edited at {messageedittime;support;11111111111111;HH:mm}\n' +
                '**Example out:**\n> Message 11111111111111 in #support was edited at 18:09'
        }];
        return embed;
    }
}

// const moment = require('moment-timezone');
// const Builder = require('../structures/TagBuilder');

// module.exports =
//     Builder.APITag('messagetime')
//         .withAlias('timestamp')
//         .withArgs(a => [a.optional([a.optional('channel'), a.required('messageid')]), a.optional('format')])
//         .withDesc('Returns the send time of the given message in the given channel using the given format.' +
//             '\n`channel` defaults to the current channel' +
//             '\n`messageid` defaults to the executing message id' +
//             '\n`format` defaults to `x`')
//         .withExample(
//             'That was sent at "{messagetime;DD/MM/YYYY HH:mm:ss}"',
//             'That was sent at "10/06/2018 10:07:44"'
//         )
//         .whenArgs('0-3', async function (subtag, context, args) {
//             let channel = context.channel;
//             let message = context.msg;
//             let format = 'x';

//             switch (args.length) {
//                 case 1:
//                     if (/^\d{17,23}$/.test(args[0]))
//                         message = await bu.getMessage(channel.id, args[0]);
//                     else
//                         format = args[0];
//                     break;
//                 case 2: {
//                     channel = Builder.util.parseChannel(context, args[0]);
//                     let i = 1;
//                     if (typeof channel === 'function') {
//                         channel = context.channel;
//                         format = args[(i = 0) + 1];
//                     }
//                     message = await bu.getMessage(channel.id, args[i]);
//                     break;
//                 }
//                 case 3:
//                     channel = Builder.util.parseChannel(context, args[0]);
//                     if (typeof channel === 'function')
//                         return channel(subtag, context);
//                     message = await bu.getMessage(channel.id, args[1]);
//                     format = args[2];
//                     break;
//             }
//             if (message == null)
//                 return Builder.errors.noMessageFound(subtag, context);
//             return moment(message.timestamp).format(format);
//         })
//         .whenDefault(Builder.errors.tooManyArguments)
//         .build();
