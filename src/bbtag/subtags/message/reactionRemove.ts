import { Emote } from '@blargbot/core';

import type { SubtagArgumentArray } from '../../arguments/index.js';
import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError, ChannelNotFoundError, MessageNotFoundError, UserNotFoundError } from '../../errors/index.js';
import { templates } from '../../text.js';
import { SubtagType } from '../../utils/index.js';
import { ChannelIdSubtag } from '../channel/channelId.js';
import type { ApiResult, CheckMessageExistsThunk, GetUserPermissionsThunk } from '../types.js';
import { IsStaffSubtag } from '../user/isStaff.js';
import type { ListMessageReactionsThunk } from './reactionList.js';

const tag = templates.subtags.reactionRemove;

export interface RemoveMessageReactionUserThunk {
    (channelId: string, messageId: string, reaction: Emote, userId: string): Promise<ApiResult>;
}

export class ReactionRemoveSubtag extends CompiledSubtag {
    readonly #getUserPermissions: GetUserPermissionsThunk;
    readonly #checkMessageExists: CheckMessageExistsThunk;
    readonly #listMessageReactions: ListMessageReactionsThunk;
    readonly #removeMessageReactionUser: RemoveMessageReactionUserThunk;
    public constructor({ getUserPermissions, checkMessageExists, listMessageReactions, removeMessageReactionUser }: {
        getUserPermissions: GetUserPermissionsThunk;
        checkMessageExists: CheckMessageExistsThunk;
        listMessageReactions: ListMessageReactionsThunk;
        removeMessageReactionUser: RemoveMessageReactionUserThunk;
    }) {
        super({
            name: 'reactionRemove',
            category: SubtagType.MESSAGE,
            aliases: ['reactRemove', 'removeReact'],
            definition: [
                {
                    parameters: ['arguments+'],
                    returns: 'nothing',
                    execute: async (ctx, args) => await this.#removeReactions(ctx, ...await this.#bindArguments(ctx, args))
                },
                {
                    parameters: ['channel?', 'messageId'],
                    description: tag.all.description,
                    exampleCode: tag.all.exampleCode,
                    exampleOut: tag.all.exampleOut
                },
                {
                    parameters: ['channel?', 'messageId', 'reactions+'],
                    description: tag.user.description,
                    exampleCode: tag.user.exampleCode,
                    exampleOut: tag.user.exampleOut
                }
            ]
        });
        this.#getUserPermissions = getUserPermissions;
        this.#checkMessageExists = checkMessageExists;
        this.#listMessageReactions = listMessageReactions;
        this.#removeMessageReactionUser = removeMessageReactionUser;
    }

    async #removeReactions(
        context: BBTagContext,
        channelId: string,
        messageId: string,
        userId: string,
        reactions: readonly Emote[] | undefined
    ): Promise<void> {
        const permissions = await this.#getUserPermissions(context.root.guildId, context.root.botId, channelId);
        if (!permissions.hasAny('ADMINISTRATOR', 'MANAGE_MESSAGES'))
            throw new BBTagRuntimeError('I need to be able to Manage Messages to remove reactions');

        if (!await this.#checkMessageExists(channelId, messageId))
            throw new MessageNotFoundError(channelId, messageId);

        if (!context.root.ownedMessageIds.has(messageId) && !await IsStaffSubtag.isStaff(context))
            throw new BBTagRuntimeError('Author must be staff to modify unrelated messages');

        if (reactions?.length === 0)
            throw new BBTagRuntimeError('Invalid Emojis');
        reactions ??= await this.#listMessageReactions(channelId, messageId) ?? [];

        const errored = [];
        for (const reaction of reactions) {
            await context.root.limit.check(context, 'reactremove:requests');
            const result = await this.#removeMessageReactionUser(channelId, messageId, reaction, userId);
            if (!result.success)
                errored.push(reaction);
        }

        if (errored.length > 0)
            throw new BBTagRuntimeError(`Unknown Emoji: ${errored.join(', ')}`);
    }

    async #bindArguments(context: BBTagContext, rawArgs: SubtagArgumentArray): Promise<[channel: string, message: string, user: string, reactions: Emote[] | undefined]> {
        const args = rawArgs.map(x => x.value);
        if (args.length === 1)
            args.unshift(context.local.message.channel.id);

        let channelId = await ChannelIdSubtag.query(context, args[0], { noLookup: true, noErrors: true });
        if (channelId !== undefined)
            args.shift();
        else if (args[0] !== context.local.message.channel.id) {
            channelId = await ChannelIdSubtag.query(context, context.local.message.channel.id, { noLookup: true, noErrors: true })
                ?? new ChannelNotFoundError(args[0]).throw();
        } else
            throw new ChannelNotFoundError(context.local.message.channel.id);

        const message = args.splice(0, 1)[0];
        if (args.length === 0)
            args.unshift(context.local.message.author.id);

        let user = await context.queryUser(args[0], { noLookup: true, noErrors: true });
        if (user !== undefined)
            args.shift();
        else if (args[0] !== context.local.message.author.id) {
            user = await context.queryUser(context.local.message.author.id, { noLookup: true, noErrors: true })
                ?? new UserNotFoundError(args[0]).throw();
        } else
            throw new UserNotFoundError(context.local.message.author.id);

        if (args.length === 0)
            return [channelId, message, user.id, undefined];

        // {reactremove;<messageId>;<...reactions>}
        // {reactremove;<channel>;<messageId>;<...reactions>}
        // {reactremove;<messageId>;<user>;<...reactions>}
        // {reactremove;<channel>;<messageId>;<user>;<...reactions>}
        return [channelId, message, user.id, args.flatMap(x => Emote.findAll(x))];
    }
}
