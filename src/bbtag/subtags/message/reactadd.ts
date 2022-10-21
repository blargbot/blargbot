import { Emote } from '@blargbot/core/Emote';
import { snowflake } from '@blargbot/core/utils';

import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { BBTagRuntimeError, ChannelNotFoundError, MessageNotFoundError } from '../../errors';
import templates from '../../text';
import { SubtagType } from '../../utils';

const tag = templates.subtags.reactadd;

export class ReactAddSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'reactadd',
            category: SubtagType.MESSAGE,
            aliases: ['addreact'],
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
    }

    public async addReactions(
        context: BBTagContext,
        channelStr: string,
        messageId: string | undefined,
        reactions: Emote[]
    ): Promise<void> {
        const channel = await context.queryChannel(channelStr, { noErrors: true, noLookup: true });
        if (channel === undefined)
            throw new ChannelNotFoundError(channelStr);

        const message = messageId === undefined ? undefined : await context.getMessage(channel, messageId);
        if (message === undefined && messageId !== undefined)
            throw new MessageNotFoundError(channel.id, messageId);

        const permissions = channel.permissionsOf(context.discord.user.id);
        if (!permissions.has('addReactions'))
            throw new BBTagRuntimeError('I dont have permission to Add Reactions');

        if (reactions.length === 0)
            throw new BBTagRuntimeError('Invalid Emojis');

        if (message !== undefined) {
            // Perform add of each reaction
            const errors = await context.util.addReactions(message, reactions);
            if (errors.failed.length > 0)
                throw new BBTagRuntimeError(`I cannot add '${errors.failed.toString()}' as reactions`);

        } else {
            // Defer reactions to output message
            context.data.reactions.push(...reactions.map(m => m.toString()));
        }
    }

    #bindArguments(context: BBTagContext, args: string[]): [channel: string, message: string | undefined, reactions: Emote[]] {
        let channel = context.channel.id;
        let message = context.data.outputMessage;

        if (args.length >= 2 && snowflake.test(args[1]))
            channel = args.splice(0, 1)[0];

        if (args.length >= 1 && snowflake.test(args[0]))
            message = args.splice(0, 1)[0];

        return [channel, message, args.flatMap(x => Emote.findAll(x))];
    }
}
