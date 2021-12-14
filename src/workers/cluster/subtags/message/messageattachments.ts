import { BBTagContext, Subtag } from '@cluster/bbtag';
import { ChannelNotFoundError, MessageNotFoundError } from '@cluster/bbtag/errors';
import { SubtagType } from '@cluster/utils';

export class MessageAttachmentsSubtag extends Subtag {
    public constructor() {
        super({
            name: 'messageattachments',
            category: SubtagType.MESSAGE,
            aliases: ['attachments'],
            definition: [
                {
                    parameters: [],
                    description: 'Returns an array of attachments of the invoking message.',
                    exampleCode: 'You sent the attachments "{messageattachments}"',
                    exampleOut: 'You sent the attachments "["https://cdn.discordapp.com/attachments/1111111111111/111111111111111/thisisntreal.png"]"',
                    returns: 'string[]',
                    execute: (ctx) => this.getMessageAttachments(ctx, ctx.channel.id, ctx.message.id, false)
                },
                {
                    parameters: ['messageid'],
                    description: 'Returns an array of attachments of `messageid` in the current channel',
                    exampleCode: 'Someone sent a message with attachments: "{messageattachments;1111111111111}"',
                    exampleOut: 'Someone sent a message with attachments: "["https://cdn.discordapp.com/attachments/1111111111111/111111111111111/thisisntreal.png"]"',
                    returns: 'string[]',
                    execute: (ctx, [messageId]) => this.getMessageAttachments(ctx, ctx.channel.id, messageId.value, false)
                },
                {
                    parameters: ['channel', 'messageid', 'quiet?'],
                    description: 'Returns an array of attachments of `messageid` from `channel`. If `quiet` is provided and `channel` cannot be found, this will return an empty array.',
                    exampleCode: 'Someone sent a message in #support with attachments: "{messageattachments;support;1111111111111}"',
                    exampleOut: 'Someone sent a message in #support with attachments: "["https://cdn.discordapp.com/attachments/1111111111111/111111111111111/thisisntreal.png"]"',
                    returns: 'string[]',
                    execute: (ctx, [channel, message, quiet]) => this.getMessageAttachments(ctx, channel.value, message.value, quiet.value !== '')
                }
            ]
        });
    }

    public async getMessageAttachments(
        context: BBTagContext,
        channelStr: string,
        messageStr: string,
        quiet: boolean
    ): Promise<string[]> {
        quiet ||= context.scopes.local.quiet ?? false;
        const channel = await context.queryChannel(channelStr, { noLookup: quiet });
        if (channel === undefined) {
            throw new ChannelNotFoundError(channelStr)
                .withDisplay(quiet ? '[]' : undefined);
        }

        try {
            const message = await context.util.getMessage(channel, messageStr);
            if (message === undefined)
                throw new MessageNotFoundError(channel, messageStr);
            return message.attachments.map(a => a.id);
        } catch (e: unknown) {
            throw new MessageNotFoundError(channel, messageStr);
        }

    }
}