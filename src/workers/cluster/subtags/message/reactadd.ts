import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { SubtagCall } from '@cluster/types';
import { parse, SubtagType } from '@cluster/utils';
import { Message, MessageEmbedOptions } from 'discord.js';

export class ReactAddSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'reactadd',
            category: SubtagType.API,
            aliases: ['addreact'],
            desc: 'Please note that to be able to add a reaction, I must be on the server that you got that reaction from. ' +
                'If I am not, then I will return an error if you are trying to apply the reaction to another message.',
            definition: [//! Overwritten
                {
                    parameters: ['reaction'],
                    execute: (ctx, args, subtag) => this.addReactions(ctx, args.map(arg => arg.value), subtag)
                },
                {
                    parameters: ['messageid', 'reaction'],
                    execute: (ctx, args, subtag) => this.addReactions(ctx, args.map(arg => arg.value), subtag)
                },
                {
                    parameters: ['channel', 'messageid', 'reactions+'],
                    execute: (ctx, args, subtag) => this.addReactions(ctx, args.map(arg => arg.value), subtag)
                }
            ]
        });
    }

    public async addReactions(
        context: BBTagContext,
        args: string[],
        subtag: SubtagCall
    ): Promise<string | void> {
        let message: Message | undefined;

        // Check if the first "emote" is actually a valid channel
        let channel = await context.queryChannel(args[0], {noErrors: true, noLookup: true});
        if (channel === undefined)
            channel = context.channel;
        else
            args.shift();
        if (channel === undefined)
            return this.channelNotFound(context, subtag);
        // Check that the current first "emote" is a message id
        if (/^\d{17,23}$/.test(args[0])) {
            try {
                message = await context.util.getMessage(channel.id, args[0]);
            } catch (e: unknown) {
                // NOOP
            }
            if (message === undefined)
                return this.noMessageFound(context, subtag);
            args.shift();
        }
        const permissions = channel.permissionsFor(context.discord.user);
        if (permissions === null || !permissions.has('ADD_REACTIONS'))
            return this.customError('I dont have permission to Add Reactions', context, subtag);
        // Find all actual emotes in remaining emotes
        const parsed = parse.emoji(args.join('|'), true);

        if (parsed.length === 0 && args.length > 0)
            return this.customError('Invalid Emojis', context, subtag);
        const outputMessage = await context.state.outputMessage;
        const reactToMessage = message !== undefined ? message :
            outputMessage !== undefined ? await context.util.getMessage(context.channel, outputMessage) : undefined;

        if (reactToMessage !== undefined) {
            // Perform add of each reaction
            const errors = await context.util.addReactions(reactToMessage, parsed);
            if (errors.failed.length > 0)
                return this.customError(`I cannot add '${errors.failed.toString()}' as reactions`, context, subtag);
        } else {
            // Defer reactions to output message
            context.state.reactions.push(...parsed);
        }
    }

    public enrichDocs(embed: MessageEmbedOptions): MessageEmbedOptions {
        embed.fields = [{
            name: 'Usage',
            value: '```\n{reactadd;<reactions...>}```\n' +
                'Adds `reactions` to the output message of this tag.'
        },
        {
            name: '\u200b',
            value: '```\n{reactadd;<messageid>;<reactions...>}```\n' +
                'Adds `reactions` to `messageid` in the current channel.'
        },
        {
            name: '\u200b',
            value: '```\n{reactadd;<channelid>;<messageid>;<reactions...>}```\n' +
                'Adds `reactions` to `messageid` in `channelid`. `channelid` must be an ID, use of `{channelid} is advised`.'
        }];
        return embed;
    }
}
