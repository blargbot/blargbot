import { BBTagContext, DefinedSubtag } from '@cluster/bbtag';
import { ChannelNotFoundError, MessageNotFoundError } from '@cluster/bbtag/errors';
import { SubtagType } from '@cluster/utils';

export class MessageTextSubtag extends DefinedSubtag {
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
                    returns: 'string',
                    execute: (ctx) => this.getMessageText(ctx, ctx.channel.id, ctx.message.id, false)
                },
                {
                    parameters: ['messageid'],
                    description: 'Returns the text of `messageid` in the current channel.',
                    exampleCode: 'KnownMessage 1111111111111 contained: "{text;1111111111111}"',
                    exampleOut: 'KnownMessage 1111111111111 contained: "Hello world!"',
                    returns: 'string',
                    execute: (ctx, [messageId]) => this.getMessageText(ctx, ctx.channel.id, messageId.value, false)
                },
                {
                    parameters: ['channel', 'messageid', 'quiet?'],
                    description: 'Returns the text of `messageid` in `channel`. If `quiet` is provided and `channel` cannot be found, this will return nothing.',
                    exampleCode: 'KnownMessage 1111111111111 in #support contained: "{text;support;1111111111111}"',
                    exampleOut: 'KnownMessage 1111111111111 in #support contained: "Spooky Stuff"',
                    returns: 'string',
                    execute: (ctx, [channel, messageId, quiet]) => this.getMessageText(ctx, channel.value, messageId.value, quiet.value !== '')
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
            throw new ChannelNotFoundError(channelStr)
                .withDisplay(quiet ? '' : undefined);
        }

        try {
            const message = await context.util.getMessage(channel, messageStr);
            if (message === undefined)
                throw new MessageNotFoundError(channel, messageStr);
            return message.content;
        } catch (e: unknown) {
            throw new MessageNotFoundError(channel, messageStr);
        }

    }
}
