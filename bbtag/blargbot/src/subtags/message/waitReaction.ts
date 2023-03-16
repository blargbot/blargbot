import { Emote } from '@blargbot/discord-emote';

import type { BBTagScript } from '../../BBTagScript.js';
import type { BBTagStatement } from '../../BBTagStatement.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError, NotANumberError, UserNotFoundError } from '../../errors/index.js';
import type { ChannelService } from '../../index.js';
import type { MessageService } from '../../services/MessageService.js';
import type { UserService } from '../../services/UserService.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import type { BBTagArrayTools } from '../../utils/index.js';
import { overrides, SubtagType } from '../../utils/index.js';
import type { BBTagValueConverter } from '../../utils/valueConverter.js';

const tag = textTemplates.subtags.waitReaction;

const defaultCondition: BBTagStatement = {
    isEmpty: false,
    ast: {
        start: { line: 0, column: 0, index: 0 },
        end: { column: 0, index: 0, line: 0 },
        source: '',
        values: []
    },
    resolve: () => 'true'
};

@Subtag.id('waitReaction', 'waitReact')
@Subtag.ctorArgs('users', 'messages', 'channels', 'arrayTools', 'converter')
export class WaitReactionSubtag extends CompiledSubtag {
    readonly #users: UserService;
    readonly #messages: MessageService;
    readonly #channels: ChannelService;
    readonly #arrayTools: BBTagArrayTools;
    readonly #converter: BBTagValueConverter;

    public constructor(users: UserService, messages: MessageService, channels: ChannelService, arrayTools: BBTagArrayTools, converter: BBTagValueConverter) {
        super({
            category: SubtagType.MESSAGE,
            description: tag.description({ disabled: overrides.waitreaction }),
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

        this.#users = users;
        this.#messages = messages;
        this.#channels = channels;
        this.#arrayTools = arrayTools;
        this.#converter = converter;
    }

    public async awaitReaction(
        context: BBTagScript,
        messageStr: string,
        userIDStr: string,
        reactions: string,
        condition: BBTagStatement,
        timeoutStr: string
    ): Promise<[channelId: string, messageId: string, userId: string, emoji: string]> {
        const messages = this.#arrayTools.flattenArray([messageStr]).map(i => this.#converter.string(i));
        const channels = this.#channels.getAll(context.runtime);
        const users = await context.runtime.bulkLookup(userIDStr, i => this.#users.querySingle(context.runtime, i, { noErrors: true, noLookup: true }), UserNotFoundError)
            ?? [context.runtime.user];

        // parse reactions
        let parsedReactions: Emote[] | undefined;
        if (reactions !== '') {
            parsedReactions = this.#arrayTools.flattenArray([reactions]).map(i => this.#converter.string(i)).flatMap(i => Emote.findAll(i));
            parsedReactions = [...new Set(parsedReactions)];
            if (parsedReactions.length === 0)
                throw new BBTagRuntimeError('Invalid Emojis');
        } else {
            parsedReactions = undefined;
        }

        let timeout = this.#converter.float(timeoutStr);
        if (timeout === undefined)
            throw new NotANumberError(timeoutStr);
        if (timeout < 0)
            timeout = 0;
        else if (timeout > 300)
            timeout = 300;

        if (condition.isEmpty)
            condition = defaultCondition;

        const userLookup = new Set(users.map(u => u.id));
        const channelLookup = new Map((await channels).map(c => [c.id, c]));
        const reactionSet = new Set(parsedReactions?.map(r => r.toString()));
        const checkReaction = reactionSet.size === 0 ? () => true : (emoji: Emote) => reactionSet.has(emoji.toString());
        const result = await this.#messages.awaitReaction(context.runtime, messages, async ({ user, reaction, message }) => {
            if (!userLookup.has(user.id) || !checkReaction(reaction))
                return false;

            const channel = channelLookup.get(message.channel_id);
            if (channel === undefined)
                return false;

            const resultStr = await context.runtime.withScope(scope => {
                scope.reaction = reaction.toString();
                scope.reactUser = user.id;
                return context.runtime.withMessage(message, channel, user, () => condition.resolve());
            });
            const result = this.#converter.boolean(resultStr.trim());
            if (result === undefined)
                throw new BBTagRuntimeError('Condition must return \'true\' or \'false\'', `Actually returned ${JSON.stringify(resultStr)}`);
            return result;
        }, timeout * 1000);

        if (result === undefined)
            throw new BBTagRuntimeError(`Wait timed out after ${timeout * 1000}`);

        return [result.message.channel_id, result.message.id, result.user.id, result.reaction.toString()];
    }
}
