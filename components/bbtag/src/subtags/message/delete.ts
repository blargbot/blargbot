import { guard } from '@blargbot/core/utils/index.js';
import type { Logger } from '@blargbot/logger';
import * as Eris from 'eris';

import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError, ChannelNotFoundError, MessageNotFoundError } from '../../errors/index.js';
import { Subtag } from '../../Subtag.js';
import templates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = templates.subtags.delete;

@Subtag.id('delete')
@Subtag.ctorArgs(Subtag.logger())
export class DeleteSubtag extends CompiledSubtag {
    readonly #logger: Logger;

    public constructor(logger: Logger) {
        super({
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

        this.#logger = logger;
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
            this.#logger.warn('Failed to delete message', e);
            // NOOP
        }
        //TODO return something like true/false
    }
}
