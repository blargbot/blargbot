import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError, ChannelNotFoundError, MessageNotFoundError } from '../../errors/index.js';
import { templates } from '../../text.js';
import { SubtagType } from '../../utils/index.js';
import { ChannelIdSubtag } from '../channel/channelId.js';
import type { CheckMessageExistsThunk, GetUserPermissionsThunk } from '../types.js';
import { IsStaffSubtag } from '../user/isStaff.js';

const tag = templates.subtags.reactionRemoveAll;

export interface RemoveMessageReactionsThunk {
    (channelId: string, messageId: string): Promise<void>;
}

export class ReactionRemoveAllSubtag extends CompiledSubtag {
    readonly #checkMessageExists: CheckMessageExistsThunk;
    readonly #getUserPermissions: GetUserPermissionsThunk;
    readonly #removeMessageReactions: RemoveMessageReactionsThunk;
    public constructor({ checkMessageExists, getUserPermissions, removeMessageReactions }: {
        checkMessageExists: CheckMessageExistsThunk;
        getUserPermissions: GetUserPermissionsThunk;
        removeMessageReactions: RemoveMessageReactionsThunk;
    }) {
        super({
            name: 'reactionRemoveAll',
            category: SubtagType.MESSAGE,
            aliases: ['reactRemoveAll', 'removeReactAll'],
            definition: [
                {
                    parameters: ['channel?', 'messageId'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'nothing',
                    execute: (ctx, [channel, message]) => this.removeAllReactions(ctx, channel.value, message.value)
                }
            ]
        });
        this.#checkMessageExists = checkMessageExists;
        this.#getUserPermissions = getUserPermissions;
        this.#removeMessageReactions = removeMessageReactions;
    }

    public async removeAllReactions(context: BBTagContext, channelStr: string, messageId: string): Promise<void> {
        const channelId = await ChannelIdSubtag.query(context, channelStr)
            ?? new ChannelNotFoundError(channelStr).throw();

        if (!await this.#checkMessageExists(channelId, messageId))
            throw new MessageNotFoundError(channelId, messageId);

        const permissions = await this.#getUserPermissions(context.root.guildId, context.root.botId, channelId);
        if (!permissions.hasAny('ADMINISTRATOR', 'MANAGE_MESSAGES'))
            throw new BBTagRuntimeError('I need to be able to Manage Messages to remove reactions');

        if (!(context.root.ownedMessageIds.has(messageId) || await IsStaffSubtag.isStaff(context)))
            throw new BBTagRuntimeError('Author must be staff to modify unrelated messages');

        await this.#removeMessageReactions(channelId, messageId);
        //TODO meaningful output please
    }
}
