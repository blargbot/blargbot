import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { ChannelNotFoundError, MessageNotFoundError } from '../../errors/index.js';
import type { ChannelService } from '../../services/ChannelService.js';
import type { MessageService } from '../../services/MessageService.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = textTemplates.subtags.messageReply;

@Subtag.names('messageReply')
@Subtag.ctorArgs(Subtag.service('channel'), Subtag.service('message'))
export class MessageReplySubtag extends CompiledSubtag {
    readonly #channels: ChannelService;
    readonly #messages: MessageService;

    public constructor(channels: ChannelService, messages: MessageService) {
        super({
            category: SubtagType.MESSAGE,
            definition: [
                {
                    parameters: [],
                    description: tag.trigger.description,
                    exampleCode: tag.trigger.exampleCode,
                    exampleOut: tag.trigger.exampleOut,
                    returns: 'id',
                    execute: (ctx) => this.getMessageReplyId(ctx, ctx.channel.id, ctx.message.id, false)
                },
                {
                    parameters: ['messageid'],
                    description: tag.inCurrent.description,
                    exampleCode: tag.inCurrent.exampleCode,
                    exampleOut: tag.inCurrent.exampleOut,
                    returns: 'id',
                    execute: (ctx, [message]) => this.getMessageReplyId(ctx, ctx.channel.id, message.value, false)
                },
                {
                    parameters: ['channel', 'messageid', 'quiet?'],
                    description: tag.inOther.description,
                    exampleCode: tag.inOther.exampleCode,
                    exampleOut: tag.inOther.exampleOut,
                    returns: 'id',
                    execute: (ctx, [channel, message, quiet]) => this.getMessageReplyId(ctx, channel.value, message.value, quiet.value !== '')
                }
            ]
        });

        this.#channels = channels;
        this.#messages = messages;
    }

    public async getMessageReplyId(context: BBTagContext, channelStr: string, messageStr: string, quiet: boolean): Promise<string> {
        quiet ||= context.scopes.local.quiet ?? false;
        const channel = await this.#channels.querySingle(context, channelStr, { noLookup: quiet });
        if (channel === undefined) {
            throw new ChannelNotFoundError(channelStr)
                .withDisplay(quiet ? '' : undefined);
        }

        const message = await this.#messages.get(context, channel.id, messageStr);
        if (message === undefined) {
            throw new MessageNotFoundError(channel.id, messageStr)
                .withDisplay(quiet ? '' : undefined);
        }

        return message.message_reference?.message_id ?? '';
    }
}