import { Emote } from '@blargbot/core/Emote';
import { snowflake } from '@blargbot/core/utils';

import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { BBTagRuntimeError, ChannelNotFoundError, MessageNotFoundError } from '../../errors';
import { SubtagType } from '../../utils';

export class ReactAddSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'reactadd',
            category: SubtagType.MESSAGE,
            aliases: ['addreact'],
            description: 'Please note that to be able to add a reaction, I must be on the server that you got that reaction from. ' +
                'If I am not, then I will return an error if you are trying to apply the reaction to another message.',
            definition: [//! Overwritten
                {
                    parameters: ['arguments+'],
                    returns: 'nothing',
                    execute: (ctx, args) => this.addReactions(ctx, ...this.bindArguments(ctx, args.map(a => a.value)))
                },
                {
                    parameters: ['reactions+'],
                    description: 'Adds `reactions` to the output message of this tag.',
                    exampleCode: 'This will have reactions! {reactadd;🤔;👀}',
                    exampleOut: 'This will have reactions! (reacted with 🤔 and 👀)'
                },
                {
                    parameters: ['messageid', 'reactions+'],
                    description: 'Adds `reactions` to `messageid` in the current channel.',
                    exampleCode: '{reactadd;11111111111111111;🤔;👀}',
                    exampleOut: '(11111111111111111 now has reactions 🤔 and 👀)'
                },
                {
                    parameters: ['channel', 'messageid', 'reactions+'],
                    description: 'Adds `reactions` to `messageid` in `channelid`. `channelid` must be an ID, use of `{channelid} is advised`.',
                    exampleCode: '{reactadd;11111111111111111;22222222222222222;🤔;👀}',
                    exampleOut: '(22222222222222222 in 11111111111111111 now has reactions 🤔 and 👀)'
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

    private bindArguments(context: BBTagContext, args: string[]): [channel: string, message: string | undefined, reactions: Emote[]] {
        let channel = context.channel.id;
        let message = context.data.outputMessage;

        if (args.length >= 2 && snowflake.test(args[1]))
            channel = args.splice(0, 1)[0];

        if (args.length >= 1 && snowflake.test(args[0]))
            message = args.splice(0, 1)[0];

        return [channel, message, args.flatMap(x => Emote.findAll(x))];
    }
}
