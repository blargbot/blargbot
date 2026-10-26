import { Emote, snowflake } from '@blargbot/core';

import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError, ChannelNotFoundError, MessageNotFoundError } from '../../errors/index.js';
import { templates } from '../../text.js';
import { SubtagType } from '../../utils/index.js';
import { ChannelIdSubtag } from '../channel/channelId.js';
import type { CheckMessageExistsFeature, GetMemberPermissionsFeature } from '../types.js';

const tag = templates.subtags.reactionAdd;

export interface AddReactionsFeature {
    addMessageReactions(channelId: string, messageId: string, reactions: Iterable<Emote>): Promise<{
        success: Emote[];
        failed: Emote[];
    }>;
}

type Features = AddReactionsFeature & CheckMessageExistsFeature & GetMemberPermissionsFeature
export class ReactionAddSubtag extends CompiledSubtag {
    readonly #features: Features;
    public constructor(features: Features) {
        super({
            name: 'reactionAdd',
            category: SubtagType.MESSAGE,
            aliases: ['reactAdd', 'addReact'],
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
        this.#features = features;
    }

    public async addReactions(
        context: BBTagContext,
        channelStr: string,
        messageId: string | undefined,
        reactions: Emote[]
    ): Promise<void> {
        const channelId = await ChannelIdSubtag.query(context, channelStr, { noErrors: true, noLookup: true })
            ?? new ChannelNotFoundError(channelStr).throw();

        if (messageId === '')
            messageId = context.local.message.id;

        if (messageId !== undefined && !await this.#features.checkMessageExists(channelId, messageId))
            throw new MessageNotFoundError(channelId, messageId);

        const permissions = await this.#features.getMemberPermissions(context.root.guildId, context.root.botId, channelId);
        if (!permissions.hasAny('ADMINISTRATOR', 'ADD_REACTIONS'))
            throw new BBTagRuntimeError('I dont have permission to Add Reactions');

        if (reactions.length === 0)
            throw new BBTagRuntimeError('Invalid Emojis');

        if (messageId !== undefined) {
            // Perform add of each reaction
            const result = await this.#features.addMessageReactions(channelId, messageId, reactions);
            if (result.failed.length > 0)
                throw new BBTagRuntimeError(`I cannot add '${result.failed.toString()}' as reactions`);

        } else {
            // Defer reactions to output message
            context.root.output.reactions.push(...reactions.map(m => m.toString()));
        }
    }

    #bindArguments(context: BBTagContext, args: string[]): [channel: string, message: string | undefined, reactions: Emote[]] {
        let channel = context.local.message.channel.id;
        let message = context.root.output.messageId;

        if (args.length >= 2 && snowflake.test(args[1]))
            channel = args.splice(0, 1)[0];

        if (args.length >= 1 && snowflake.test(args[0]))
            message = args.splice(0, 1)[0];

        return [channel, message, args.flatMap(x => Emote.findAll(x))];
    }
}
