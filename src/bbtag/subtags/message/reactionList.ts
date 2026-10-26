import { Emote, snowflake } from '@blargbot/core';

import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError, ChannelNotFoundError, MessageNotFoundError } from '../../errors/index.js';
import { templates } from '../../text.js';
import { SubtagType } from '../../utils/index.js';
import { ChannelIdSubtag } from '../channel/channelId.js';

const tag = templates.subtags.reactionList;

export interface ListMessageReactionsFeature {
    listMessageReactions(channelId: string, messageId: string): Promise<readonly Emote[] | undefined>;
}

export interface ListMessageReactionUsersFeature {
    listMessageReactionUsers(channelId: string, messageId: string, reaction: Emote): Promise<readonly string[] | undefined>;
}

type Features = ListMessageReactionUsersFeature & ListMessageReactionsFeature
export class ReactionListSubtag extends CompiledSubtag {
    readonly #features: Features;
    public constructor(features: Features) {
        super({
            name: 'reactionList',
            category: SubtagType.MESSAGE,
            aliases: ['reactList', 'listReact'],
            definition: [//! overwritten
                {
                    parameters: [],
                    returns: 'error',
                    execute: (ctx) => { throw new MessageNotFoundError(ctx.local.message.channel.id, ''); }
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
        this.#features = features;
    }

    public async getReactionsOrReactors(
        context: BBTagContext,
        channelStr: string,
        messageId: string,
        reactions: Emote[] | undefined
    ): Promise<Iterable<string>> {
        const channelId = await ChannelIdSubtag.query(context, channelStr, { noErrors: true, noLookup: true })
            ?? new ChannelNotFoundError(channelStr).throw();

        const messageReactions = await this.#features.listMessageReactions(channelId, messageId)
            ?? new MessageNotFoundError(channelId, messageId).throw();

        if (reactions === undefined)
            return messageReactions.map(x => x.toApi());

        if (reactions.length === 0)
            throw new BBTagRuntimeError('Invalid Emojis');

        // List all users per reaction
        const users: string[] = [];
        const errors = [];
        for (const emote of reactions) {
            const reactionUsers = await this.#features.listMessageReactionUsers(channelId, messageId, emote);
            if (reactionUsers === undefined)
                errors.push(emote);
            else
                users.push(...reactionUsers);
        }

        if (errors.length > 0)
            throw new BBTagRuntimeError(`Unknown Emoji: ${errors.join(', ')}`);
        return [...new Set(users)];
    }

    public async getReactions(context: BBTagContext, messageId: string): Promise<string[]> {
        const emotes = await this.#features.listMessageReactions(context.local.message.channel.id, messageId)
            ?? new MessageNotFoundError(context.local.message.channel.id, messageId).throw();
        return emotes.map(x => x.toApi());
    }

    #bindArguments(context: BBTagContext, args: string[]): [channel: string, message: string, reactions: Emote[] | undefined] {
        let channel = context.local.message.channel.id;

        if (args.length >= 2 && snowflake.test(args[1]))
            channel = args.splice(0, 1)[0];

        const message = args.splice(0, 1)[0];

        if (args.length === 0)
            return [channel, message, undefined];

        return [channel, message, args.flatMap(x => Emote.findAll(x))];
    }
}
