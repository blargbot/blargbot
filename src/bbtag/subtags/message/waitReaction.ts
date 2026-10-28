import { discord } from '@blargbot/core';
import Emote from '@blargbot/discord-emote';

import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError, NotANumberError, UserNotFoundError } from '../../errors/index.js';
import type { BBTagExpression } from '../../language/index.js';
import { templates } from '../../text.js';
import type { ReactionEvent } from '../../types.js';
import { convertToBoolean, convertToNumber, convertToString } from '../../utils/converters.js';
import { bbtag, SubtagType } from '../../utils/index.js';
import { UserIdSubtag } from '../user/userId.js';

const tag = templates.subtags.waitReaction;

const defaultCondition = bbtag.parse('true');

export interface StreamReactionsFeature {
    streamReactions(messageIds: Iterable<string>, timeoutMs: number): AsyncIterable<ReactionEvent>;
}

type Features = StreamReactionsFeature
export class WaitReactionSubtag extends CompiledSubtag {
    readonly #features: Features;
    public constructor(features: Features) {
        super({
            name: 'waitReaction',
            category: SubtagType.MESSAGE,
            aliases: ['waitReact'],
            description: tag.description({ disabled: bbtag.overrides.waitreaction }),
            definition: [
                {
                    parameters: ['messages', 'userIDs?'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleIn: tag.default.exampleIn,
                    exampleOut: tag.default.exampleOut,
                    returns: 'id[]',
                    execute: (ctx, [messages, userIDs]) => this.awaitReaction(ctx, messages.value, userIDs.value, '', defaultCondition, '60')
                },
                {
                    parameters: ['messages', 'userIDs', 'reactions', '~condition?:true', 'timeout?:60'],
                    description: tag.filtered.description,
                    exampleCode: tag.filtered.exampleCode,
                    exampleIn: tag.filtered.exampleIn,
                    exampleOut: tag.filtered.exampleOut,
                    returns: 'string[]',
                    execute: (ctx, [messages, userIDs, reactions, condition, timeout]) => this.awaitReaction(ctx, messages.value, userIDs.value, reactions.value, condition.code, timeout.value)
                }
            ]
        });
        this.#features = features;
    }

    public async awaitReaction(
        context: BBTagContext,
        messageStr: string,
        userIDStr: string,
        reactions: string,
        condition: BBTagExpression,
        timeoutStr: string
    ): Promise<[channelId: string, messageId: string, userId: string, emoji: string]> {
        const messages = bbtag.tagArray.flattenArray([messageStr]).map(convertToString);
        const users = await this.#bulkLookup(userIDStr, i => UserIdSubtag.query(context, i, { noLookup: true, global: true }), UserNotFoundError)
            ?? [context.local.userId];

        // parse reactions
        let parsedReactions: Emote[] | undefined;
        if (reactions !== '') {
            parsedReactions = bbtag.tagArray.flattenArray([reactions]).map(convertToString).flatMap(i => Emote.findAll(i));
            parsedReactions = [...new Set(parsedReactions)];
            if (parsedReactions.length === 0)
                throw new BBTagRuntimeError('Invalid Emojis');
        } else {
            parsedReactions = undefined;
        }

        const timeout = Math.max(0, Math.min(convertToNumber(timeoutStr) ?? NaN, 300));
        if (isNaN(timeout))
            throw new NotANumberError(timeoutStr);

        if (condition.values.length === 0)
            condition = defaultCondition;

        const userSet = new Set(users);
        const reactionSet = new Set(parsedReactions?.map(r => r.toString()));
        const checkReaction = reactionSet.size === 0 ? () => true : (emoji: Emote) => reactionSet.has(emoji.toString());
        for await (const event of this.#features.streamReactions(messages, timeout * 1000)) {
            if (!userSet.has(event.reactorId) || !checkReaction(event.reaction) || event.guildId !== context.root.guildId)
                continue;

            using scope = context.enterScope();
            scope.reaction = event.reaction.toString();
            scope.reactUser = event.reactorId;
            scope.messageId = event.messageId;
            scope.channelId = event.channelId;
            scope.userId = event.authorId;
            const resultStr = await context.eval(condition);
            switch (convertToBoolean(resultStr.trim())) {
                case undefined:
                    throw new BBTagRuntimeError('Condition must return \'true\' or \'false\'', `Actually returned ${JSON.stringify(resultStr)}`);
                case true:
                    return [event.channelId, event.messageId, event.reactorId, discord.emojiString(event.reaction)];
            }
        }

        throw new BBTagRuntimeError(`Wait timed out after ${timeout * 1000}`);
    }

    async #bulkLookup<T>(source: string, lookup: (value: string) => Awaitable<T | undefined>, error: new (term: string) => BBTagRuntimeError): Promise<T[] | undefined> {
        if (source === '')
            return undefined;

        const flatSource = bbtag.tagArray.flattenArray([source])
            .map(convertToString)
            .map(async input => {
                const element = await lookup(input);
                if (element === undefined)
                    throw new error(input);
                return element;
            });
        return await Promise.all(flatSource);
    }
}
