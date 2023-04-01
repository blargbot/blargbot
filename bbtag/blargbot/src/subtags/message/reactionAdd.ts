import { Emote } from '@blargbot/discord-emote';
import Discord from '@blargbot/discord-types';
import { hasFlag } from '@blargbot/guards';
import snowflake from '@blargbot/snowflakes';

import type { BBTagScript } from '../../BBTagScript.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError, ChannelNotFoundError, MessageNotFoundError } from '../../errors/index.js';
import type { ChannelService } from '../../services/ChannelService.js';
import type { MessageService } from '../../services/MessageService.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = textTemplates.subtags.reactionAdd;

@Subtag.id('reactionAdd', 'reactAdd', 'addReact')
@Subtag.ctorArgs('messages', 'channels')
export class ReactionAddSubtag extends CompiledSubtag {
    readonly #channels: ChannelService;
    readonly #messages: MessageService;

    public constructor(messages: MessageService, channels: ChannelService) {
        super({
            category: SubtagType.MESSAGE,
            description: tag.description,
            definition: [//! Overwritten
                {
                    parameters: ['arguments+'],
                    returns: 'nothing',
                    execute: (ctx, args) => this.addReactions(ctx, ...this.#bindArguments(ctx, args.map(a => a.value)))
                },
                {
                    parameters: ['reactions+'],
                    description: tag.output.description,
                    exampleCode: tag.output.exampleCode,
                    exampleOut: tag.output.exampleOut
                },
                {
                    parameters: ['messageid', 'reactions+'],
                    description: tag.inCurrent.description,
                    exampleCode: tag.inCurrent.exampleCode,
                    exampleOut: tag.inCurrent.exampleOut
                },
                {
                    parameters: ['channel', 'messageid', 'reactions+'],
                    description: tag.inOther.description,
                    exampleCode: tag.inOther.exampleCode,
                    exampleOut: tag.inOther.exampleOut
                }
            ]
        });

        this.#messages = messages;
        this.#channels = channels;
    }

    public async addReactions(
        context: BBTagScript,
        channelStr: string,
        messageId: string | undefined,
        reactions: Emote[]
    ): Promise<void> {
        const channel = await this.#channels.querySingle(context.runtime, channelStr, { noErrors: true, noLookup: true });
        if (channel === undefined)
            throw new ChannelNotFoundError(channelStr);

        const message = messageId === undefined ? undefined : await this.#messages.get(context.runtime, channel.id, messageId);
        if (message === undefined && messageId !== undefined)
            throw new MessageNotFoundError(channel.id, messageId);

        const permissions = context.runtime.getPermission(context.runtime.bot, channel);
        if (!hasFlag(permissions, Discord.PermissionFlagsBits.AddReactions))
            throw new BBTagRuntimeError('I dont have permission to Add Reactions');

        if (reactions.length === 0)
            throw new BBTagRuntimeError('Invalid Emojis');

        if (message !== undefined) {
            // Perform add of each reaction
            const errors = await this.#messages.addReactions(context.runtime, channel.id, message.id, reactions);
            if (errors.failed.length > 0)
                throw new BBTagRuntimeError(`I cannot add '${errors.failed.toString()}' as reactions`);

        } else {
            // Defer reactions to output message
            context.runtime.outputOptions.reactions.push(...reactions.map(m => m.toString()));
        }
    }

    #bindArguments(context: BBTagScript, args: string[]): [channel: string, message: string | undefined, reactions: Emote[]] {
        let channel = context.runtime.channel.id;
        let message = context.runtime.outputOptions.id;

        if (args.length >= 2 && snowflake.test(args[1]))
            channel = args.splice(0, 1)[0];

        if (args.length >= 1 && snowflake.test(args[0]))
            message = args.splice(0, 1)[0];

        return [channel, message, args.flatMap(x => Emote.findAll(x))];
    }
}
