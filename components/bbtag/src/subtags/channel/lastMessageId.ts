import { guard } from '@blargbot/core/utils/index.js';

import { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError, ChannelNotFoundError } from '../../errors/index.js';
import templates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = templates.subtags.lastMessageId;

export class LastMessageIdSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'lastMessageId',
            category: SubtagType.CHANNEL,
            description: tag.description,
            definition: [
                {
                    parameters: [],
                    description: tag.current.description,
                    exampleCode: tag.current.exampleCode,
                    exampleOut: tag.current.exampleOut,
                    returns: 'id',
                    execute: (ctx) => this.getLastMessageID(ctx, ctx.channel.id)
                },
                {
                    parameters: ['channel'],
                    description: tag.channel.description,
                    exampleCode: tag.channel.exampleCode,
                    exampleOut: tag.channel.exampleOut,
                    returns: 'id',
                    execute: (ctx, [channel]) => this.getLastMessageID(ctx, channel.value)
                }
            ]
        });
    }

    public async getLastMessageID(
        context: BBTagContext,
        channelStr: string
    ): Promise<string> {
        const channel = await context.queryChannel(channelStr, {
            noLookup: context.scopes.local.quiet,
            noErrors: context.scopes.local.noLookupErrors
        });

        if (channel === undefined)
            throw new ChannelNotFoundError(channelStr);
        if (!guard.isTextableChannel(channel))
            throw new BBTagRuntimeError('Channel must be a textable channel');

        return channel.lastMessageID;
    }
}
