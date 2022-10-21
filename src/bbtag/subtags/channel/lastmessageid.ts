import { guard } from '@blargbot/core/utils';

import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { BBTagRuntimeError, ChannelNotFoundError } from '../../errors';
import templates from '../../text';
import { SubtagType } from '../../utils';

const tag = templates.subtags.lastmessageid;

export class LastMessageIdSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'lastmessageid',
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
