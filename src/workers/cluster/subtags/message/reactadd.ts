import { BBTagContext, DefinedSubtag } from '@cluster/bbtag';
import { BBTagRuntimeError, MessageNotFoundError } from '@cluster/bbtag/errors';
import { parse, SubtagType } from '@cluster/utils';
import { EmbedOptions, KnownMessage } from 'eris';

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
                    parameters: ['reaction'],
                    returns: 'nothing',
                    execute: (ctx, args) => this.addReactions(ctx, args.map(arg => arg.value))
                },
                {
                    parameters: ['messageid', 'reaction'],
                    returns: 'nothing',
                    execute: (ctx, args) => this.addReactions(ctx, args.map(arg => arg.value))
                },
                {
                    parameters: ['channel', 'messageid', 'reactions+'],
                    returns: 'nothing',
                    execute: (ctx, args) => this.addReactions(ctx, args.map(arg => arg.value))
                }
            ]
        });
    }

    public async addReactions(
        context: BBTagContext,
        args: string[]
    ): Promise<void> {
        let message: KnownMessage | undefined;

        // Check if the first "emote" is actually a valid channel
        let channel = await context.queryChannel(args[0], { noErrors: true, noLookup: true });
        if (channel === undefined)
            channel = context.channel;
        else
            args.shift();

        // Check that the current first "emote" is a message id
        if (/^\d{17,23}$/.test(args[0])) {
            try {
                message = await context.util.getMessage(channel.id, args[0]);
            } catch (e: unknown) {
                // NOOP
            }
            if (message === undefined)
                throw new MessageNotFoundError(channel, args[0]);
            args.shift();
        }
        const permissions = channel.permissionsOf(context.discord.user.id);
        if (!permissions.has('addReactions'))
            throw new BBTagRuntimeError('I dont have permission to Add Reactions');
        // Find all actual emotes in remaining emotes
        const parsed = parse.emoji(args.join('|'), true);

        if (parsed.length === 0 && args.length > 0)
            throw new BBTagRuntimeError('Invalid Emojis');
        const outputMessage = await context.state.outputMessage;
        const reactToMessage = message !== undefined ? message :
            outputMessage !== undefined ? await context.util.getMessage(context.channel, outputMessage) : undefined;

        if (reactToMessage !== undefined) {
            // Perform add of each reaction
            const errors = await context.util.addReactions(reactToMessage, parsed);
            if (errors.failed.length > 0)
                throw new BBTagRuntimeError(`I cannot add '${errors.failed.toString()}' as reactions`);
        } else {
            // Defer reactions to output message
            context.state.reactions.push(...parsed);
        }
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
