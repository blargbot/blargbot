import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { SubtagCall } from '@cluster/types';
import { SubtagType } from '@cluster/utils';
import { Message } from 'discord.js';

export class MessageTextSubtag extends BaseSubtag {
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
                    execute: (ctx, _, subtag) => this.getMessageText(ctx, ctx.channel.id, ctx.message.id, false, subtag)
                },
                {
                    parameters: ['messageid'],
                    description: 'Returns the text of `messageid` in the current channel.',
                    exampleCode: 'Message 1111111111111 contained: "{text;1111111111111}"',
                    exampleOut: 'Message 1111111111111 contained: "Hello world!"',
                    execute: (ctx, args, subtag) => this.getMessageText(ctx, ctx.channel.id, args[0].value, false, subtag)
                },
                {
                    parameters: ['channel', 'messageid', 'quiet?'],
                    description: 'Returns the text of `messageid` in `channel`. If `quiet` is provided and `channel` cannot be found, this will return nothing.',
                    exampleCode: 'Message 1111111111111 in #support contained: "{text;support;1111111111111}"',
                    exampleOut: 'Message 1111111111111 in #support contained: "Spooky Stuff"',
                    execute: (ctx, args, subtag) => this.getMessageText(ctx, args[0].value, args[1].value, args[2].value !== '', subtag)
                }
            ]
        });
    }

    public async getMessageText(
        context: BBTagContext,
        channelStr: string,
        messageStr: string,
        quiet: boolean,
        subtag: SubtagCall
    ): Promise<string> {
        quiet ||= context.scopes.local.quiet ?? false;
        const channel = await context.queryChannel(channelStr, { noLookup: quiet });
        if (channel === undefined)
            return quiet ? '' : this.channelNotFound(context, subtag, `${channelStr} could not be found`);
        let message: Message | undefined;
        try {
            message = await context.util.getMessage(channel, messageStr);
            if (message === undefined)
                return this.noMessageFound(context, subtag, `${messageStr} could not be found`);
            return message.content;
        } catch (e: unknown) {
            return this.noMessageFound(context, subtag, `${messageStr} could not be found`);
        }

    }
}
