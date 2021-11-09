import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { ChannelNotFoundError, MessageNotFoundError } from '@cluster/bbtag/errors';
import { SubtagType } from '@cluster/utils';
import { Message } from 'discord.js';

function getUrls(message: Message): string {
    return JSON.stringify(message.attachments.map(a => a.url));
}

export class MessageAttachmentsSubtag extends BaseSubtag {
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
                    execute: (ctx) => this.getMessageAttachments(ctx, ctx.channel.id, ctx.message.id, false)
                },
                {
                    parameters: ['messageid'],
                    description: 'Returns an array of attachments of `messageid` in the current channel',
                    exampleCode: 'Someone sent a message with attachments: "{messageattachments;1111111111111}"',
                    exampleOut: 'Someone sent a message with attachments: "["https://cdn.discordapp.com/attachments/1111111111111/111111111111111/thisisntreal.png"]"',
                    execute: (ctx, args) => this.getMessageAttachments(ctx, ctx.channel.id, args[0].value, false)
                },
                {
                    parameters: ['channel', 'messageid', 'quiet?'],
                    description: 'Returns an array of attachments of `messageid` from `channel`. If `quiet` is provided and `channel` cannot be found, this will return an empty array.',
                    exampleCode: 'Someone sent a message in #support with attachments: "{messageattachments;support;1111111111111}"',
                    exampleOut: 'Someone sent a message in #support with attachments: "["https://cdn.discordapp.com/attachments/1111111111111/111111111111111/thisisntreal.png"]"',
                    execute: (ctx, args) => this.getMessageAttachments(ctx, args[0].value, args[1].value, args[2].value !== '')
                }
            ]
        });
    }

    public async getMessageAttachments(
        context: BBTagContext,
        channelStr: string,
        messageStr: string,
        quiet: boolean
    ): Promise<string> {
        quiet ||= context.scopes.local.quiet ?? false;
        const channel = await context.queryChannel(channelStr, { noLookup: quiet });
        if (channel === undefined) {
            if (quiet)
                return '[]';
            throw new ChannelNotFoundError(channelStr);
        }

        let message: Message | undefined;
        try {
            message = await context.util.getMessage(channel, messageStr);
            if (message === undefined)
                throw new MessageNotFoundError(channel, messageStr);
            return getUrls(message);
        } catch (e: unknown) {
            throw new MessageNotFoundError(channel, messageStr);
        }

    }
}
