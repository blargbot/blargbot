import { } from '@bbtag/subtag'
import { p } from '../p.js';
import { Subtag } from '@bbtag/subtag';
import { ChannelNotFoundError, MessageNotFoundError } from '@bbtag/engine';

export class MessageAttachmentsSubtag extends Subtag {
    public constructor() {
        super({
            name: 'messageAttachments',
            category: SubtagType.MESSAGE,
            aliases: ['attachments'],
            definition: [
                {
                    parameters: [],
                    description: tag.trigger.description,
                    exampleCode: tag.trigger.exampleCode,
                    exampleOut: tag.trigger.exampleOut,
                    returns: 'string[]',
                    execute: (ctx) => this.getMessageAttachments(ctx, ctx.channel.id, ctx.message.id, false)
                },
                {
                    parameters: ['messageid'],
                    description: tag.inCurrent.description,
                    exampleCode: tag.inCurrent.exampleCode,
                    exampleOut: tag.inCurrent.exampleOut,
                    returns: 'string[]',
                    execute: (ctx, [messageId]) => this.getMessageAttachments(ctx, ctx.channel.id, messageId.value, false)
                },
                {
                    parameters: ['channel', 'messageid', 'quiet?'],
                    description: tag.inOther.description,
                    exampleCode: tag.inOther.exampleCode,
                    exampleOut: tag.inOther.exampleOut,
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

        const message = await context.getMessage(channel, messageStr);
        if (message === undefined) {
            throw new MessageNotFoundError(channel.id, messageStr)
                .withDisplay(quiet ? '[]' : undefined);
        }

        return message.attachments.map(a => a.url);
    }
}
