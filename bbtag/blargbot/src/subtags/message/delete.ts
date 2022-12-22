import { guard } from '@blargbot/core/utils/index.js';
import * as Eris from 'eris';

import { } from '@bbtag/subtag'
import { p } from '../p.js';
import { Subtag } from '@bbtag/subtag';
import { BBTagRuntimeError, ChannelNotFoundError, MessageNotFoundError } from '@bbtag/engine';

export class DeleteSubtag extends Subtag {
    public constructor() {
        super({
            name: 'delete',
            description: tag.description,
            category: SubtagType.MESSAGE,
            definition: [
                {
                    parameters: [],
                    description: tag.trigger.description,
                    exampleCode: tag.trigger.exampleCode,
                    exampleOut: tag.trigger.exampleOut,
                    returns: 'nothing',
                    execute: (ctx) => this.deleteMessage(ctx, ctx.channel.id, ctx.message.id)
                },
                {
                    parameters: ['messageId'],
                    description: tag.inCurrent.description,
                    exampleCode: tag.inCurrent.exampleCode,
                    exampleOut: tag.inCurrent.exampleOut,
                    returns: 'nothing',
                    execute: (ctx, [messageId]) => this.deleteMessage(ctx, ctx.channel.id, messageId.value)
                },
                {
                    parameters: ['channel', 'messageId'],
                    description: tag.inOther.description,
                    exampleCode: tag.inOther.exampleCode,
                    exampleOut: tag.inOther.exampleOut,
                    returns: 'nothing',
                    execute: (ctx, [channel, messageId]) => this.deleteMessage(ctx, channel.value, messageId.value)
                }
            ]
        });
    }

    public async deleteMessage(
        context: BBTagContext,
        channelStr: string,
        messageId: string
    ): Promise<void> {
        if (!(context.ownsMessage(messageId) || await context.isStaff))
            throw new BBTagRuntimeError('Author must be staff to delete unrelated messages');

        const channel = await context.queryChannel(channelStr);
        if (channel === undefined)
            throw new ChannelNotFoundError(channelStr);

        if (messageId.length === 0 || !guard.isTextableChannel(channel))
            throw new MessageNotFoundError(channel.id, messageId).withDisplay('');

        const msg = await context.getMessage(channel, messageId);
        if (msg === undefined)
            throw new MessageNotFoundError(channel.id, messageId).withDisplay('');

        try {
            await msg.delete();
        } catch (e: unknown) {
            if (e instanceof Eris.DiscordRESTError && e.code === Eris.ApiError.UNKNOWN_MESSAGE)
                return;
            context.logger.warn('Failed to delete message', e);
            // NOOP
        }
        //TODO return something like true/false
    }
}
