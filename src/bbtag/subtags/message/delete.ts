import { guard } from '@blargbot/core';
import type { Logger } from '@blargbot/logger';
import * as eris from 'eris';

import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError, ChannelNotFoundError, MessageNotFoundError } from '../../errors/index.js';
import { templates } from '../../text.js';
import { SubtagType } from '../../utils/index.js';
import { IsStaffSubtag } from '../user/isStaff.js';

const tag = templates.subtags.delete;

export class DeleteSubtag extends CompiledSubtag {
    readonly #logger: Logger;
    public constructor({ logger }: { logger: Logger; }) {
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
                    execute: (ctx) => this.deleteMessage(ctx, ctx.local.message.channel.id, ctx.local.message.id)
                },
                {
                    parameters: ['messageId'],
                    description: tag.inCurrent.description,
                    exampleCode: tag.inCurrent.exampleCode,
                    exampleOut: tag.inCurrent.exampleOut,
                    returns: 'nothing',
                    execute: (ctx, [messageId]) => this.deleteMessage(ctx, ctx.local.message.channel.id, messageId.value)
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
        this.#logger = logger;
    }

    public async deleteMessage(
        context: BBTagContext,
        channelStr: string,
        messageId: string
    ): Promise<void> {
        if (!(context.root.ownedMessageIds.has(messageId) || await IsStaffSubtag.isStaff(context)))
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
            if (e instanceof eris.DiscordRESTError && e.code === eris.ApiError.UNKNOWN_MESSAGE)
                return;
            this.#logger.warn('Failed to delete message', e);
            // NOOP
        }
        //TODO return something like true/false
    }
}
