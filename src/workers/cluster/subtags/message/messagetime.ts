import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { SubtagCall } from '@cluster/types';
import { SubtagType } from '@cluster/utils';
import { MessageEmbedOptions } from 'discord.js';
import moment from 'moment';

export class MessageTimeSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'messagetime',
            category: SubtagType.API,
            aliases: ['timestamp'],
            definition: [//! overwritten
                {
                    parameters: [],
                    description: 'Returns the send time of the executing message in unix milliseconds.',
                    exampleCode: 'The timestamp of your message is "{timestamp}"',
                    exampleOut: 'The timestamp of your message is "1628782144703"',
                    execute: (ctx) => ctx.message.createdTimestamp.toString()
                },
                {
                    parameters: ['format|messageid'],
                    description: 'If the first argument is a messageid, this will return the send time of `messageid` in unix. ' +
                        'Else this will return the send time of the executing message in `format`.',
                    execute: (context, args, subtag) => {
                        if (/^\d{17,23}/.test(args[0].value))
                            return this.getMessageTime(context, context.channel.id, args[0].value, 'x', subtag);
                        return this.getMessageTime(context, context.channel.id, context.message.id, args[0].value, subtag);
                    }
                },
                {
                    parameters: ['channel|messageid', 'messageid|format'],
                    description: '{messagetime;<channel>;<messageid>} or {messagetime;<messagetime;<format>}',
                    execute: async (context, args, subtag) => {
                        const channel = await context.queryChannel(args[0].value, { noErrors: true });
                        if (channel === undefined)
                            return this.getMessageTime(context, context.channel.id, args[0].value, args[1].value, subtag);
                        return this.getMessageTime(context, args[0].value, args[1].value, 'x', subtag);
                    }
                },
                {
                    parameters: ['channel', 'messageid', 'format'],
                    description: '{messagetime;<channel>;<messageid>;<format>}',
                    execute: (context, args, subtag) => this.getMessageTime(context, args[0].value, args[1].value, args[2].value, subtag)
                }
            ]
        });
    }

    public async getMessageTime(
        context: BBTagContext,
        channelStr: string,
        messageStr: string,
        format: string,
        subtag: SubtagCall
    ): Promise<string> {
        const channel = await context.queryChannel(channelStr, { noLookup: true }); //TODO lookup
        if (channel === undefined)
            return this.channelNotFound(context, subtag);

        try {
            const message = await context.util.getMessage(channel.id, messageStr);
            if (message === undefined)
                return this.noMessageFound(context, subtag);
            return moment(message.createdTimestamp).format(format);
        } catch (e: unknown) {
            return this.noMessageFound(context, subtag);
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
