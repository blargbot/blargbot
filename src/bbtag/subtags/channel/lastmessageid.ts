import { guard } from '@blargbot/core/utils';

import { BBTagContext } from '../../BBTagContext';
import { DefinedSubtag } from '../../DefinedSubtag';
import { BBTagRuntimeError, ChannelNotFoundError } from '../../errors';
import { SubtagType } from '../../utils';

export class LastMessageIdSubtag extends DefinedSubtag {
    public constructor() {
        super({
            name: 'lastmessageid',
            category: SubtagType.CHANNEL,
            desc: 'Returns nothing if the channel doesn\'t have any messages.',
            definition: [
                {
                    parameters: [],
                    description: 'Returns the messageID of the last message in the current channel.',
                    exampleCode: '{lastmessageid}',
                    exampleOut: '1111111111111111',
                    returns: 'id',
                    execute: (ctx) => this.getLastMessageID(ctx, ctx.channel.id)
                },
                {
                    parameters: ['channel'],
                    description: 'Returns the messageID of the last message in `channel`.',
                    exampleCode: '{lastmessageid;1111111111111111}',
                    exampleOut: '2222222222222222',
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
