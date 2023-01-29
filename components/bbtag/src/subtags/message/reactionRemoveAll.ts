import { hasFlag } from '@blargbot/guards';
import * as Discord from 'discord-api-types/v10';

import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError, ChannelNotFoundError, MessageNotFoundError } from '../../errors/index.js';
import type { ChannelService } from '../../services/ChannelService.js';
import type { MessageService } from '../../services/MessageService.js';
import { Subtag } from '../../Subtag.js';
import templates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = templates.subtags.reactionRemoveAll;

@Subtag.names('reactionRemoveAll', 'reactRemoveAll', 'removeReactAll')
@Subtag.ctorArgs(Subtag.service('channel'), Subtag.service('message'))
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

    public async removeAllReactions(context: BBTagContext, channelStr: string, messageId: string): Promise<void> {
        const channel = await this.#channels.querySingle(context, channelStr);
        if (channel === undefined)
            throw new ChannelNotFoundError(channelStr);

        const message = await this.#messages.get(context, channel.id, messageId);
        if (message === undefined)
            throw new MessageNotFoundError(channel.id, messageId);

        const permissions = context.getPermission(context.bot, channel);
        if (!hasFlag(permissions, Discord.PermissionFlagsBits.ManageMessages))
            throw new BBTagRuntimeError('I need to be able to Manage Messages to remove reactions');

        if (!(context.isStaff || context.ownsMessage(message.id)))
            throw new BBTagRuntimeError('Author must be staff to modify unrelated messages');

        await this.#messages.removeReactions(context, channel.id, message.id);
        //TODO meaningful output please
    }
}
