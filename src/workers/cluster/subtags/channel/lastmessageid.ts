import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { BBTagRuntimeError, ChannelNotFoundError } from '@cluster/bbtag/errors';
import { SubtagType } from '@cluster/utils';
import { guard } from '@core/utils';

export class LastMessageIdSubtag extends BaseSubtag {
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
                    execute: (ctx) => this.getLastMessageID(ctx, ctx.channel.id)
                },
                {
                    parameters: ['channel'],
                    description: 'Returns the messageID of the last message in `channel`.',
                    exampleCode: '{lastmessageid;1111111111111111}',
                    exampleOut: '2222222222222222',
                    execute: (ctx, args) => this.getLastMessageID(ctx, args[0].value)
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
        if (guard.isTextableChannel(channel))
            return channel.lastMessageId ?? '';

        throw new BBTagRuntimeError('Channel must be a textable channel');
    }
}
