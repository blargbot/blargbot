import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { SubtagCall } from '@cluster/types';
import { SubtagType } from '@cluster/utils';
import { Message } from 'discord.js';

function getUrls(message: Message): string {
    return JSON.stringify(message.attachments.map(a => a.url));
}

export class MessageAttachmentsSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'messageattachments',
            category: SubtagType.API,
            aliases: ['attachments'],
            definition: [
                {
                    parameters: [],
                    description: 'Returns an array of attachments of the invoking message.',
                    exampleCode: 'You sent the attachments "{messageattachments}"',
                    exampleOut: 'You sent the attachments "["https://cdn.discordapp.com/attachments/1111111111111/111111111111111/thisisntreal.png"]"',
                    execute: (ctx, _, subtag) => this.getMessageAttachments(ctx, ctx.channel.id, ctx.message.id, '', subtag)
                },
                {
                    parameters: ['messageid'],
                    description: 'Returns an array of attachments of `messageid` in the current channel',
                    exampleCode: 'Someone sent a message with attachments: "{messageattachments;1111111111111}"',
                    exampleOut: 'Someone sent a message with attachments: "["https://cdn.discordapp.com/attachments/1111111111111/111111111111111/thisisntreal.png"]"',
                    execute: (ctx, args, subtag) => this.getMessageAttachments(ctx, ctx.channel.id, args[0].value, '', subtag)
                },
                {
                    parameters: ['channel', 'messageid', 'quiet?'],
                    description: 'Returns an array of attachments of `messageid` from `channel`. If `quiet` is provided and `channel` cannot be found, this will return an empty array.',
                    exampleCode: 'Someone sent a message in #support with attachments: "{messageattachments;support;1111111111111}"',
                    exampleOut: 'Someone sent a message in #support with attachments: "["https://cdn.discordapp.com/attachments/1111111111111/111111111111111/thisisntreal.png"]"',
                    execute: (ctx, args, subtag) => this.getMessageAttachments(ctx, args[0].value, args[1].value, args[2].value, subtag)
                }
            ]
        });
    }

    public async getMessageAttachments(
        context: BBTagContext,
        channelStr: string,
        messageStr: string,
        quietStr: string,
        subtag: SubtagCall
    ): Promise<string> {
        const quiet = typeof context.scope.quiet === 'boolean' ? context.scope.quiet : quietStr.length > 0;
        const channel = await context.getChannel(channelStr, { quiet, suppress: context.scope.suppressLookup });
        if (channel === undefined)
            return quiet ? '[]' : this.channelNotFound(context, subtag, `${channelStr} could not be found`);
        let message: Message | undefined;
        try {
            message = await context.util.getMessage(channel, messageStr);
            if (message === undefined)
                return this.noMessageFound(context, subtag, `${messageStr} could not be found`);
            return getUrls(message);
        } catch (e: unknown) {
            return this.noMessageFound(context, subtag, `${messageStr} could not be found`);
        }

    }
}
