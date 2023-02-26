import { Emote } from '@blargbot/discord-emote';
import Discord from '@blargbot/discord-types';
import { hasFlag } from '@blargbot/guards';

import type { SubtagArgumentArray } from '../../arguments/index.js';
import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError, ChannelNotFoundError, MessageNotFoundError, UserNotFoundError } from '../../errors/index.js';
import type { ChannelService } from '../../services/ChannelService.js';
import type { MessageService } from '../../services/MessageService.js';
import type { UserService } from '../../services/UserService.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = textTemplates.subtags.reactionRemove;

@Subtag.names('reactionRemove', 'reactRemove', 'removeReact')
@Subtag.ctorArgs(Subtag.service('user'), Subtag.service('channel'), Subtag.service('message'))
export class ReactionRemoveSubtag extends CompiledSubtag {
    readonly #users: UserService;
    readonly #channels: ChannelService;
    readonly #messages: MessageService;

    public constructor(users: UserService, channels: ChannelService, messages: MessageService) {
        super({
            category: SubtagType.MESSAGE,
            definition: [
                {
                    parameters: ['arguments+'],
                    returns: 'nothing',
                    execute: async (ctx, args) => await this.removeReactions(ctx, ...await this.#bindArguments(ctx, args))
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

        this.#users = users;
        this.#channels = channels;
        this.#messages = messages;
    }

    public async removeReactions(
        context: BBTagContext,
        channelStr: string,
        messageId: string,
        userStr: string,
        reactions: Emote[] | undefined
    ): Promise<void> {
        const channel = await this.#channels.querySingle(context, channelStr, { noErrors: true, noLookup: true });
        if (channel === undefined)
            throw new ChannelNotFoundError(channelStr);

        const permissions = context.getPermission(context.bot, channel);
        if (!hasFlag(permissions, Discord.PermissionFlagsBits.ManageMessages))
            throw new BBTagRuntimeError('I need to be able to Manage Messages to remove reactions');

        const message = await this.#messages.get(context, channel.id, messageId);
        if (message === undefined)
            throw new MessageNotFoundError(channel.id, messageId);

        if (!context.ownsMessage(message.id) && !context.isStaff)
            throw new BBTagRuntimeError('Author must be staff to modify unrelated messages');

        const user = await this.#users.querySingle(context, userStr, { noErrors: true, noLookup: true });
        if (user === undefined)
            throw new UserNotFoundError(userStr);

        if (reactions?.length === 0)
            throw new BBTagRuntimeError('Invalid Emojis');
        reactions ??= message.reactions?.map(r => Emote.create(r.emoji)) ?? [];

        const result = await this.#messages.removeReactions(context, channel.id, message.id, user.id, reactions);
        if (result === 'noPerms')
            throw new BBTagRuntimeError('I need to be able to Manage Messages to remove reactions');

        if (result.failed.length > 0)
            throw new BBTagRuntimeError(`Unknown Emoji: ${result.failed.join(', ')}`);
    }

    async #bindArguments(context: BBTagContext, rawArgs: SubtagArgumentArray): Promise<[channel: string, message: string, user: string, reactions: Emote[] | undefined]> {
        const args = [...rawArgs];
        if (args.length === 1)
            return [context.channel.id, args[0].value, context.user.id, undefined];

        const channel = await this.#channels.querySingle(context, args[0].value, { noLookup: true, noErrors: true });
        const channelId = channel?.id ?? context.channel.id;
        if (channel !== undefined)
            args.shift();

        const message = args.splice(0, 1)[0].value;
        if (args.length === 0)
            // {reactremove;<messageId>}
            // {reactremove;<channel>;<messageId>}
            return [channelId, message, context.user.id, undefined];

        const user = await this.#users.querySingle(context, args[0].value, { noLookup: true, noErrors: true });
        const userId = user?.id ?? context.user.id;
        if (user !== undefined)
            args.shift();

        if (args.length === 0)
            // {reactremove;<messageId>;<user>}
            // {reactremove;<channel>;<messageId>;<user>}
            return [channelId, message, userId, undefined];

        // {reactremove;<messageId>;<...reactions>}
        // {reactremove;<channel>;<messageId>;<...reactions>}
        // {reactremove;<messageId>;<user>;<...reactions>}
        // {reactremove;<channel>;<messageId>;<user>;<...reactions>}
        return [channelId, message, userId, args.flatMap(x => Emote.findAll(x.value))];
    }
}
