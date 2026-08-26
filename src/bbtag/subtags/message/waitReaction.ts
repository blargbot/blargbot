import { Emote } from '@blargbot/core/Emote.js';
import { clamp, discord, guard, parse } from '@blargbot/core/utils/index.js';

import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError, NotANumberError, UserNotFoundError } from '../../errors/index.js';
import type { Statement } from '../../language/index.js';
import templates from '../../text.js';
import { bbtag, SubtagType } from '../../utils/index.js';

const tag = templates.subtags.waitReaction;

const defaultCondition = bbtag.parse('true');

export class WaitReactionSubtag extends CompiledSubtag {
    public constructor() {
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
    }

    public async awaitReaction(
        context: BBTagContext,
        messageStr: string,
        userIDStr: string,
        reactions: string,
        condition: Statement,
        timeoutStr: string
    ): Promise<[channelId: string, messageId: string, userId: string, emoji: string]> {
        const messages = bbtag.tagArray.flattenArray([messageStr]).map(i => parse.string(i));
        const users = await this.bulkLookup(userIDStr, i => context.queryUser(i, { noErrors: true, noLookup: true }), UserNotFoundError)
            ?? [context.user];

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
        const result = await context.util.awaitReaction(messages, async ({ user, reaction, message }) => {
            if (!userSet.has(user.id) || !checkReaction(reaction) || !guard.isGuildMessage(message))
                return false;

            const resultStr = await context.withScope(scope => {
                scope.reaction = reaction.toString();
                scope.reactUser = user.id;
                return context.withChild({ message }, context => context.eval(condition));
            });
            const result = parse.boolean(resultStr.trim());
            if (result === undefined)
                throw new BBTagRuntimeError('Condition must return \'true\' or \'false\'', `Actually returned ${JSON.stringify(resultStr)}`);
            return result;
        }, timeout * 1000);

        if (result === undefined)
            throw new BBTagRuntimeError(`Wait timed out after ${timeout * 1000}`);

        return [result.message.channel.id, result.message.id, result.user.id, discord.emojiString(result.reaction)];
    }
}
