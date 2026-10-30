import Emote from '@blargbot/discord-emote';

import type { SubtagArgumentArray } from '../../arguments/index.js';
import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError, ChannelNotFoundError, MessageNotFoundError, UserNotFoundError } from '../../errors/index.js';
import { templates } from '../../text.js';
import { SubtagType } from '../../utils/index.js';
import { ChannelIdSubtag } from '../channel/channelId.js';
import type { ApiResult, CheckMessageExistsFeature, GetMemberPermissionsFeature } from '../types.js';
import { IsStaffSubtag } from '../user/isStaff.js';
import { UserIdSubtag } from '../user/userId.js';
import type { ListMessageReactionsFeature } from './reactionList.js';

const tag = templates.subtags.reactionRemove;

export interface RemoveMessageReactionUserFeature {
    removeMessageReactionUser(channelId: string, messageId: string, reaction: Emote, userId: string): Promise<ApiResult>;
}

type Features = RemoveMessageReactionUserFeature & CheckMessageExistsFeature & GetMemberPermissionsFeature & ListMessageReactionsFeature
export class ReactionRemoveSubtag extends CompiledSubtag {
    readonly #features: Features;
    public constructor(features: Features) {
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
        this.#features = features;
    }

    async #removeReactions(
        context: BBTagContext,
        channelId: string,
        messageId: string,
        userId: string,
        reactions: readonly Emote[] | undefined
    ): Promise<void> {
        const permissions = await this.#features.getMemberPermissions(context.root.guildId, context.root.botId, channelId);
        if (!permissions.hasAny('ADMINISTRATOR', 'MANAGE_MESSAGES'))
            throw new BBTagRuntimeError('I need to be able to Manage Messages to remove reactions');

        if (!await this.#features.checkMessageExists(channelId, messageId))
            throw new MessageNotFoundError(channelId, messageId);

        if (!context.root.ownedMessageIds.has(messageId) && !await IsStaffSubtag.isStaff(context))
            throw new BBTagRuntimeError('Author must be staff to modify unrelated messages');

        if (reactions?.length === 0)
            throw new BBTagRuntimeError('Invalid Emojis');
        reactions ??= await this.#features.listMessageReactions(channelId, messageId) ?? [];

        const errored = [];
        for (const reaction of reactions) {
            await context.hooks.loop?.(this);
            const result = await this.#features.removeMessageReactionUser(channelId, messageId, reaction, userId);
            if (!result.success)
                errored.push(reaction);
        }

        if (errored.length > 0)
            throw new BBTagRuntimeError(`Unknown Emoji: ${errored.join(', ')}`);
    }

    async #bindArguments(context: BBTagContext, rawArgs: SubtagArgumentArray): Promise<[channel: string, message: string, user: string, reactions: Emote[] | undefined]> {
        const args = rawArgs.map(x => x.value);
        if (args.length === 1)
            args.unshift(context.local.channelId);

        let channelId = await ChannelIdSubtag.query(context, args[0], { noLookup: true, noErrors: true });
        if (channelId !== undefined)
            args.shift();
        else if (args[0] !== context.local.channelId) {
            channelId = await ChannelIdSubtag.query(context, context.local.channelId, { noLookup: true, noErrors: true })
                ?? new ChannelNotFoundError(args[0]).throw();
        } else
            throw new ChannelNotFoundError(context.local.channelId);

        const message = args.splice(0, 1)[0];
        if (args.length === 0)
            args.unshift(context.local.userId);

        let userId = await UserIdSubtag.query(context, args[0], { noLookup: true, noErrors: true, global: true });
        if (userId !== undefined)
            args.shift();
        else if (args[0] !== context.local.userId) {
            userId = await UserIdSubtag.query(context, context.local.userId, { noLookup: true, noErrors: true, global: true })
                ?? new UserNotFoundError(args[0]).throw();
        } else
            throw new UserNotFoundError(context.local.userId);

        if (args.length === 0)
            return [channelId, message, userId, undefined];

        // {reactremove;<messageId>;<...reactions>}
        // {reactremove;<channel>;<messageId>;<...reactions>}
        // {reactremove;<messageId>;<user>;<...reactions>}
        // {reactremove;<channel>;<messageId>;<user>;<...reactions>}
        return [channelId, message, userId, args.flatMap(x => Emote.findAll(x))];
    }
}
