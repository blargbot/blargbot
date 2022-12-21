import { Emote } from '@blargbot/core/Emote.js';
import { snowflake } from '@blargbot/core/utils/index.js';
import * as Eris from 'eris';

import { subtagParameter as p } from '../../execution/parameters/index.js';
import { Subtag } from '../../execution/Subtag.js';
import { BBTagRuntimeError, ChannelNotFoundError, MessageNotFoundError } from '../../errors/index.js';

export class ReactionListSubtag extends Subtag {
    public constructor() {
        super({
            name: 'reactionList',
            category: SubtagType.MESSAGE,
            aliases: ['reactList', 'listReact'],
            definition: [//! overwritten
                {
                    parameters: [],
                    returns: 'error',
                    execute: (ctx) => { throw new MessageNotFoundError(ctx.channel.id, ''); }
                },
                {
                    parameters: ['messageid'],
                    returns: 'string[]',
                    execute: (ctx, [messageid]) => this.getReactions(ctx, messageid.value)
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
    }

    public async getReactionsOrReactors(
        context: BBTagContext,
        channelStr: string,
        messageId: string,
        reactions: Emote[] | undefined
    ): Promise<Iterable<string>> {
        const channel = await context.queryChannel(channelStr, { noErrors: true, noLookup: true });
        if (channel === undefined)
            throw new ChannelNotFoundError(channelStr);

        const message = await context.getMessage(channel, messageId, true);
        if (message === undefined)
            throw new MessageNotFoundError(channel.id, messageId);

        if (reactions === undefined)
            return Object.keys(message.reactions);

        if (reactions.length === 0)
            throw new BBTagRuntimeError('Invalid Emojis');

        // List all users per reaction
        const users: string[] = [];
        const errors = [];
        for (const emote of reactions) {
            try {
                const reactionUsers = await message.getReaction(emote.toApi());
                users.push(...reactionUsers.map(u => u.id));
            } catch (err: unknown) {
                if (!(err instanceof Eris.DiscordRESTError) || err.code !== Eris.ApiError.UNKNOWN_EMOJI)
                    throw err;
                errors.push(emote);
            }
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

    public async getReactions(context: BBTagContext, messageId: string): Promise<string[]> {
        const msg = await context.getMessage(context.channel, messageId, true);
        if (msg === undefined)
            throw new MessageNotFoundError(context.channel.id, messageId);
        return Object.keys(msg.reactions);
    }
}
