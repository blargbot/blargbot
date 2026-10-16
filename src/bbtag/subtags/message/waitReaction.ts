import { clamp, discord, Emote, guard, parse } from '@blargbot/core';

import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError, NotANumberError, UserNotFoundError } from '../../errors/index.js';
import type { BBTagExpression } from '../../language/index.js';
import { templates } from '../../text.js';
import type { ReactionEvent } from '../../types.js';
import { bbtag, SubtagType } from '../../utils/index.js';

const tag = templates.subtags.waitReaction;

const defaultCondition = bbtag.parse('true');

export interface StreamReactionsThunk {
    (messageIds: Iterable<string>, timeoutMs: number): AsyncIterable<ReactionEvent>;
}

export class WaitReactionSubtag extends CompiledSubtag {
    readonly #streamReactions: StreamReactionsThunk;
    public constructor({ streamReactions }: { streamReactions: StreamReactionsThunk; }) {
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
        this.#streamReactions = streamReactions;
    }

    public async awaitReaction(
        context: BBTagContext,
        messageStr: string,
        userIDStr: string,
        reactions: string,
        condition: BBTagExpression,
        timeoutStr: string
    ): Promise<[channelId: string, messageId: string, userId: string, emoji: string]> {
        const messages = bbtag.tagArray.flattenArray([messageStr]).map(i => parse.string(i));
        const users = await this.bulkLookup(userIDStr, i => context.queryUser(i, { noErrors: true, noLookup: true }), UserNotFoundError)
            ?? [context.local.message.author];

        // parse reactions
        let parsedReactions: Emote[] | undefined;
        if (reactions !== '') {
            parsedReactions = bbtag.tagArray.flattenArray([reactions]).map(i => parse.string(i)).flatMap(i => Emote.findAll(i));
            parsedReactions = [...new Set(parsedReactions)];
            if (parsedReactions.length === 0)
                throw new BBTagRuntimeError('Invalid Emojis');
        } else {
            parsedReactions = undefined;
        }

        const timeout = clamp(parse.float(timeoutStr) ?? NaN, 0, 300);
        if (isNaN(timeout))
            throw new NotANumberError(timeoutStr);

        if (condition.values.length === 0)
            condition = defaultCondition;

        const userSet = new Set(users.map(u => u.id));
        const reactionSet = new Set(parsedReactions?.map(r => r.toString()));
        const checkReaction = reactionSet.size === 0 ? () => true : (emoji: Emote) => reactionSet.has(emoji.toString());
        for await (const { user, reaction, message } of this.#streamReactions(messages, timeout * 1000)) {
            if (!userSet.has(user.id) || !checkReaction(reaction) || !guard.isGuildMessage(message))
                continue;

            using scope = context.enterScope();
            scope.reaction = reaction.toString();
            scope.reactUser = user.id;
            scope.message = message;
            const resultStr = await context.eval(condition);
            switch (parse.boolean(resultStr.trim())) {
                case undefined:
                    throw new BBTagRuntimeError('Condition must return \'true\' or \'false\'', `Actually returned ${JSON.stringify(resultStr)}`);
                case true:
                    return [message.channel.id, message.id, user.id, discord.emojiString(reaction)];
            }
        }

        throw new BBTagRuntimeError(`Wait timed out after ${timeout * 1000}`);
    }
}
