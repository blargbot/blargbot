import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError, ChannelNotFoundError, MessageNotFoundError } from '../../errors/index.js';
import { templates } from '../../text.js';
import { SubtagType } from '../../utils/index.js';
import { ChannelIdSubtag } from '../channel/channelId.js';
import type { CheckMessageExistsFeature, GetMemberPermissionsFeature } from '../types.js';
import { IsStaffSubtag } from '../user/isStaff.js';

const tag = templates.subtags.reactionRemoveAll;

export interface RemoveMessageReactionsFeature {
    removeMessageReactions(channelId: string, messageId: string): Promise<void>;
}

type Features = RemoveMessageReactionsFeature & CheckMessageExistsFeature & GetMemberPermissionsFeature
export class ReactionRemoveAllSubtag extends CompiledSubtag {
    readonly #features: Features;
    public constructor(features: Features) {
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
        this.#features = features;
    }

    public async removeAllReactions(context: BBTagContext, channelStr: string, messageId: string): Promise<void> {
        const channelId = await ChannelIdSubtag.query(context, channelStr)
            ?? new ChannelNotFoundError(channelStr).throw();

        if (!await this.#features.checkMessageExists(channelId, messageId))
            throw new MessageNotFoundError(channelId, messageId);

        const permissions = await this.#features.getMemberPermissions(context.root.guildId, context.root.botId, channelId);
        if (!permissions.hasAny('ADMINISTRATOR', 'MANAGE_MESSAGES'))
            throw new BBTagRuntimeError('I need to be able to Manage Messages to remove reactions');

        if (!(context.root.ownedMessageIds.has(messageId) || await IsStaffSubtag.isStaff(context)))
            throw new BBTagRuntimeError('Author must be staff to modify unrelated messages');

        await this.#features.removeMessageReactions(channelId, messageId);
        //TODO meaningful output please
    }
}
