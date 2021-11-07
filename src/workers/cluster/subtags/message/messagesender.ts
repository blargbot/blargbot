import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { SubtagCall } from '@cluster/types';
import { SubtagType } from '@cluster/utils';
import { Message } from 'discord.js';

export class MessageSenderSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'messagesender',
            category: SubtagType.MESSAGE,
            aliases: ['sender'],
            definition: [
                {
                    parameters: [],
                    description: 'Returns the id of the author of the executing message.',
                    exampleCode: 'That was sent by "{sender}"',
                    exampleOut: 'That was sent by "1111111111111"',
                    execute: (ctx, _, subtag) => this.getMessageSender(ctx, ctx.channel.id, ctx.message.id, false, subtag)
                },
                {
                    parameters: ['messageid'],
                    description: 'Returns the id of the author of `messageid` in the current channel.',
                    exampleCode: 'Message 1111111111111 was sent by {sender;1111111111111}',
                    exampleOut: 'Message 1111111111111 was sent by 2222222222222',
                    execute: (ctx, args, subtag) => this.getMessageSender(ctx, ctx.channel.id, args[0].value, false, subtag)
                },
                {
                    parameters: ['channel', 'messageid', 'quiet?'],
                    description: 'Returns the id of the author of `messageid` in `channel`. If `quiet` is provided and `channel` cannot be found, this will return nothing.',
                    exampleCode: 'Message 1111111111111 in #support was sent by {sender;support;1111111111111}',
                    exampleOut: 'Message 1111111111111 in #support was sent by 2222222222222',
                    execute: (ctx, args, subtag) => this.getMessageSender(ctx, args[0].value, args[1].value, args[2].value !== '', subtag)
                }
            ]
        });
    }

    public async getMessageSender(
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
            return message.author.id;
        } catch (e: unknown) {
            return this.noMessageFound(context, subtag, `${messageStr} could not be found`);
        }

    }
}
