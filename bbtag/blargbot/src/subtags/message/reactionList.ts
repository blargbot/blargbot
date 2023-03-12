import { Emote } from '@blargbot/discord-emote';
import { snowflake } from '@blargbot/discord-util';

import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError, ChannelNotFoundError, MessageNotFoundError } from '../../errors/index.js';
import type { ChannelService } from '../../services/ChannelService.js';
import type { MessageService } from '../../services/MessageService.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import type { Entities } from '../../types.js';
import { SubtagType } from '../../utils/index.js';

const tag = textTemplates.subtags.reactionList;

@Subtag.names('reactionList', 'reactList', 'listReact')
@Subtag.ctorArgs('channel', 'message')
export class ReactionListSubtag extends CompiledSubtag {
    readonly #channels: ChannelService;
    readonly #messages: MessageService;

    public constructor(channels: ChannelService, messages: MessageService) {
        super({
            category: SubtagType.MESSAGE,
            definition: [
                {
                    parameters: [],
                    returns: 'error',
                    execute: (ctx) => { throw new MessageNotFoundError(ctx.channel.id, ''); }
                },
                {
                    parameters: ['messageid'],
                    returns: 'string[]',
                    execute: (ctx, [messageid]) => this.getReactions(ctx, ctx.channel.id, messageid.value)
                },
                {
                    parameters: ['arguments+2'],
                    returns: 'string[]',
                    execute: (ctx, args) => this.getReactionsOrReactors(ctx, ...this.#bindArguments(ctx, args.map(arg => arg.value)))
                },
                {
                    parameters: ['channel?', 'messageId'],
                    description: tag.reactions.description,
                    exampleCode: tag.reactions.exampleCode,
                    exampleOut: tag.reactions.exampleOut
                },
                {
                    parameters: ['channel?', 'messageId', 'reactions+'],
                    description: tag.users.description,
                    exampleCode: tag.users.exampleCode,
                    exampleOut: tag.users.exampleOut
                }
            ]
        });

        this.#channels = channels;
        this.#messages = messages;
    }

    public async getReactionsOrReactors(
        context: BBTagContext,
        channelStr: string,
        messageId: string,
        reactions: Emote[] | undefined
    ): Promise<Iterable<string>> {
        const channel = await this.#channels.querySingle(context, channelStr, { noErrors: true, noLookup: true });
        if (channel === undefined)
            throw new ChannelNotFoundError(channelStr);

        if (reactions === undefined)
            return await this.getReactions(context, channel.id, messageId);

        const message = await this.#messages.get(context, channel.id, messageId);
        if (message === undefined)
            throw new MessageNotFoundError(channel.id, messageId);

        if (reactions.length === 0)
            throw new BBTagRuntimeError('Invalid Emojis');

        // List all users per reaction
        const users: string[] = [];
        const errors = [];
        for (const emote of reactions) {
            const reactionUsers = await this.#messages.getReactors(context, channel.id, message.id, emote);
            if (reactionUsers === 'unknownEmote')
                errors.push(emote);
            else if (typeof reactionUsers !== 'string')
                users.push(...reactionUsers);
        }

        if (errors.length > 0)
            throw new BBTagRuntimeError(`Unknown Emoji: ${errors.join(', ')}`);
        return [...new Set(users)];
    }

    #bindArguments(context: BBTagContext, args: string[]): [channel: string, message: string, reactions: Emote[] | undefined] {
        let channel = context.channel.id;
        let message = '';

        if (args.length >= 2 && snowflake.test(args[1]))
            channel = args.splice(0, 1)[0];

        message = args.splice(0, 1)[0];

        if (args.length === 0)
            return [channel, message, undefined];

        return [channel, message, args.flatMap(x => Emote.findAll(x))];
    }

    public async getReactions(context: BBTagContext, channelId: string, messageId: string): Promise<string[]> {
        const msg = await this.#messages.get(context, channelId, messageId);
        if (msg === undefined)
            throw new MessageNotFoundError(channelId, messageId);
        return this.#getReactions(msg);
    }

    #getReactions(message: Entities.Message): string[] {
        return message.reactions?.map(r => Emote.create(r.emoji).toApi()) ?? [];
    }
}
