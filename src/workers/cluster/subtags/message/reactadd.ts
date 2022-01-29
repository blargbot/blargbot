import { BBTagContext, DefinedSubtag } from '@cluster/bbtag';
import { BBTagRuntimeError, ChannelNotFoundError, MessageNotFoundError } from '@cluster/bbtag/errors';
import { snowflake, SubtagType } from '@cluster/utils';
import { Emote } from '@core/Emote';
import { EmbedOptions } from 'eris';

export class ReactAddSubtag extends DefinedSubtag {
    public constructor() {
        super({
            name: 'reactadd',
            category: SubtagType.MESSAGE,
            aliases: ['addreact'],
            desc: 'Please note that to be able to add a reaction, I must be on the server that you got that reaction from. ' +
                'If I am not, then I will return an error if you are trying to apply the reaction to another message.',
            definition: [//! Overwritten
                {
                    parameters: ['arguments+'],
                    returns: 'nothing',
                    execute: (ctx, args) => this.addReactions(ctx, ...this.bindArguments(ctx, args.map(a => a.value)))
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

        const message = messageId === undefined ? undefined : await context.util.getMessage(channel, messageId);
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
            context.state.reactions.push(...reactions.map(m => m.toString()));
        }
    }

    private bindArguments(context: BBTagContext, args: string[]): [channel: string, message: string | undefined, reactions: Emote[]] {
        let channel = context.channel.id;
        let message = context.state.outputMessage;

        if (args.length >= 2 && snowflake.test(args[1]))
            channel = args.splice(0, 1)[0];

        if (args.length >= 1 && snowflake.test(args[0]))
            message = args.splice(0, 1)[0];

        return [channel, message, args.flatMap(x => Emote.findAll(x))];
    }

    public enrichDocs(embed: EmbedOptions): EmbedOptions {
        embed.fields = [{
            name: 'Usage',
            value: '```\n{reactadd;<reactions...>}```\n' +
                'Adds `reactions` to the output message of this tag.\n\n' +
                '**Example code:**\n> This will have reactions! {reactadd;🤔;👀}\n' +
                '**Example out:**\n> This will have reactions! (reacted with 🤔 and 👀)'
        },
        {
            name: '\u200b',
            value: '```\n{reactadd;<messageid>;<reactions...>}```\n' +
                'Adds `reactions` to `messageid` in the current channel.\n\n' +
                '**Example code:**\n> {reactadd;11111111111111111;🤔;👀}\n' +
                '**Example out:**\n> (11111111111111111 now has reactions 🤔 and 👀)'
        },
        {
            name: '\u200b',
            value: '```\n{reactadd;<channelid>;<messageid>;<reactions...>}```\n' +
                'Adds `reactions` to `messageid` in `channelid`. `channelid` must be an ID, use of `{channelid} is advised`.\n\n' +
                '**Example code:**\n> {reactadd;11111111111111111;22222222222222222;🤔;👀}\n' +
                '**Example out:**\n> (22222222222222222 in 11111111111111111 now has reactions 🤔 and 👀)'

        }];
        return embed;
    }
}
