import { BBTagContext, Subtag } from '@cluster/bbtag';
import { ChannelNotFoundError, MessageNotFoundError } from '@cluster/bbtag/errors';
import { SubtagType } from '@cluster/utils';
import { Message } from 'discord.js';

export class MessageTextSubtag extends Subtag {
    public constructor() {
        super({
            name: 'messagetext',
            category: SubtagType.MESSAGE,
            aliases: ['text'],
            definition: [
                {
                    parameters: [],
                    description: 'Returns the text of the executing message.',
                    exampleCode: 'You sent "text"',
                    exampleOut: 'You sent "b!t test You sent "{text}""`',
                    execute: (ctx) => this.getMessageText(ctx, ctx.channel.id, ctx.message.id, false)
                },
                {
                    parameters: ['messageid'],
                    description: 'Returns the text of `messageid` in the current channel.',
                    exampleCode: 'Message 1111111111111 contained: "{text;1111111111111}"',
                    exampleOut: 'Message 1111111111111 contained: "Hello world!"',
                    execute: (ctx, args) => this.getMessageText(ctx, ctx.channel.id, args[0].value, false)
                },
                {
                    parameters: ['channel', 'messageid', 'quiet?'],
                    description: 'Returns the text of `messageid` in `channel`. If `quiet` is provided and `channel` cannot be found, this will return nothing.',
                    exampleCode: 'Message 1111111111111 in #support contained: "{text;support;1111111111111}"',
                    exampleOut: 'Message 1111111111111 in #support contained: "Spooky Stuff"',
                    execute: (ctx, args) => this.getMessageText(ctx, args[0].value, args[1].value, args[2].value !== '')
                }
            ]
        });
    }

    public async getMessageText(
        context: BBTagContext,
        channelStr: string,
        messageStr: string,
        quiet: boolean
    ): Promise<string> {
        quiet ||= context.scopes.local.quiet ?? false;
        const channel = await context.queryChannel(channelStr, { noLookup: quiet });
        if (channel === undefined) {
            if (quiet)
                return '';
            throw new ChannelNotFoundError(channelStr);
        }

        let message: Message | undefined;
        try {
            message = await context.util.getMessage(channel, messageStr);
            if (message === undefined)
                throw new MessageNotFoundError(channel, messageStr);
            return message.content;
        } catch (e: unknown) {
            throw new MessageNotFoundError(channel, messageStr);
        }

    }
}
