import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { ChannelNotFoundError, MessageNotFoundError } from '../../errors';
import { SubtagType } from '../../utils';

export class MessageReplySubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'messagereply',
            category: SubtagType.MESSAGE,
            definition: [
                {
                    parameters: [],
                    description: 'Returns the ID of the invoking message\'s parent message.',
                    exampleCode: 'You replied to the message {messagereply}',
                    exampleOut: 'You replied to the message 1111111111111',
                    returns: 'id',
                    execute: (ctx) => this.getMessageReplyId(ctx, ctx.channel.id, ctx.message.id, false)
                },
                {
                    parameters: ['messageid'],
                    description: '',
                    exampleCode: '',
                    exampleOut: '',
                    returns: 'id',
                    execute: (ctx, [message]) => this.getMessageReplyId(ctx, ctx.channel.id, message.value, false)
                },
                {
                    parameters: ['channel', 'messageid', 'quiet?'],
                    description: 'Returns the ID of the parent message of the provided `message`.',
                    exampleCode: 'Someone replied to the message {messagereply;general;2222222222222}',
                    exampleOut: 'Someone replied to the message 1111111111111',
                    returns: 'id',
                    execute: (ctx, [channel, message, quiet]) => this.getMessageReplyId(ctx, channel.value, message.value, quiet.value !== '')
                }
            ]
        });
    }

    public async getMessageReplyId(context: BBTagContext, channelStr: string, messageStr: string, quiet: boolean): Promise<string> {
        quiet ||= context.scopes.local.quiet ?? false;
        const channel = await context.queryChannel(channelStr, { noLookup: quiet });
        if (channel === undefined) {
            throw new ChannelNotFoundError(channelStr)
                .withDisplay(quiet ? '' : undefined);
        }

        const message = await context.util.getMessage(channel, messageStr);
        if (message === undefined) {
            throw new MessageNotFoundError(channel.id, messageStr)
                .withDisplay(quiet ? '' : undefined);
        }

        return message.messageReference?.messageID ?? '';
    }
}
