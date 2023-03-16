import Discord from '@blargbot/discord-types';
import { hasFlag } from '@blargbot/guards';

import type { BBTagScript } from '../../BBTagScript.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError, ChannelNotFoundError, MessageNotFoundError } from '../../errors/index.js';
import type { ChannelService } from '../../services/ChannelService.js';
import type { MessageService } from '../../services/MessageService.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = textTemplates.subtags.reactionRemoveAll;

@Subtag.id('reactionRemoveAll', 'reactRemoveAll', 'removeReactAll')
@Subtag.ctorArgs('channels', 'messages')
export class ReactionRemoveAllSubtag extends CompiledSubtag {
    readonly #channels: ChannelService;
    readonly #messages: MessageService;

    public constructor(channels: ChannelService, messages: MessageService) {
        super({
            category: SubtagType.MESSAGE,
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

        this.#channels = channels;
        this.#messages = messages;
    }

    public async removeAllReactions(context: BBTagScript, channelStr: string, messageId: string): Promise<void> {
        const channel = await this.#channels.querySingle(context.runtime, channelStr);
        if (channel === undefined)
            throw new ChannelNotFoundError(channelStr);

        const message = await this.#messages.get(context.runtime, channel.id, messageId);
        if (message === undefined)
            throw new MessageNotFoundError(channel.id, messageId);

        const permissions = context.runtime.getPermission(context.runtime.bot, channel);
        if (!hasFlag(permissions, Discord.PermissionFlagsBits.ManageMessages))
            throw new BBTagRuntimeError('I need to be able to Manage Messages to remove reactions');

        if (!context.runtime.ownsMessage(message.id))
            throw new BBTagRuntimeError('Author must be staff to modify unrelated messages');

        await this.#messages.removeReactions(context.runtime, channel.id, message.id);
        //TODO meaningful output please
    }
}
