import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { MessageNotFoundError } from '@cluster/bbtag/errors';
import { SubtagCall } from '@cluster/types';
import { parse, SubtagType } from '@cluster/utils';
import { Message, MessageEmbedOptions } from 'discord.js';

export class ReactListSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'reactlist',
            category: SubtagType.MESSAGE,
            aliases: ['listreact'],
            definition: [//! overwritten
                {
                    parameters: [],
                    description: 'This just returns `No message found` ***always*** for the sake of backwards compatibility.',
                    execute: (ctx) => { throw new MessageNotFoundError(ctx.channel, ''); }
                },
                {
                    parameters: ['messageid'],
                    description: 'Returns an array of reactions on `messageid`.',
                    execute: async (context, [messageStr]) => {
                        const msg = await context.util.getMessage(context.channel, messageStr.value, true);
                        if (msg === undefined)
                            throw new MessageNotFoundError(context.channel, messageStr.value);
                        return JSON.stringify(msg.reactions.cache.map(r => r.emoji.toString()));
                    }
                },
                {
                    parameters: ['channelid|messageid', 'messageid|reactions'],
                    description: 'Either returns an array of users who reacted with `reactions` on `messageid`, or returns an array of reactions on `messageid` in `channelid`',
                    execute: (ctx, args, subtag) => this.getReactions(ctx, subtag, args.map(arg => arg.value))
                },
                {
                    parameters: ['channelid|message', 'messageid|reactions', 'reactions+'],
                    description: 'Either returns an array of users who reacted with `reactions` on `messageid` in `channelid`, or returns an array of users who reacted `reactions` on `messageid`.',
                    execute: (ctx, args, subtag) => this.getReactions(ctx, subtag, args.map(arg => arg.value))
                }
            ]
        });
    }

    public async getReactions(
        context: BBTagContext,
        subtag: SubtagCall,
        args: string[]
    ): Promise<string> {
        let channel;
        let message: Message | undefined;

        // Check if the first "emote" is actually a valid channel
        channel = await context.queryChannel(args[0], { noLookup: true });
        if (channel === undefined)
            channel = context.channel;
        else
            args.shift();

        // Check that the current first "emote" is a message id
        try {
            message = await context.util.getMessage(channel.id, args[0]);
        } catch (e: unknown) {
            // NOOP
        }
        if (message === undefined)
            throw new MessageNotFoundError(channel, args[0]);
        args.shift();

        // Find all actual emotes in remaining emotes
        const parsedEmojis = parse.emoji(args.join('|'), true);

        if (parsedEmojis.length === 0 && args.length > 0)
            return this.customError('Invalid Emojis', context, subtag);

        // Default to listing what emotes there are
        if (parsedEmojis.length === 0)
            return JSON.stringify(message.reactions.cache.map(r => r.emoji.toString()));

        // List all users per reaction
        const users: string[] = [];
        const errors = [];
        for (let emote of parsedEmojis) {
            emote = emote.replace(/^a?:/gi, '');
            if (!message.reactions.cache.has(emote)) {
                continue;
            }
            try {
                const reactionUsers = await message.reactions.cache.get(emote)?.users.fetch();
                if (reactionUsers !== undefined)
                    users.push(...reactionUsers.keys());
            } catch (err: unknown) {
                if (err instanceof Error)
                    if (err.message === 'Unknown Emoji')
                        errors.push(emote);
                    else
                        throw err;
            }
        }

        if (errors.length > 0)
            return this.customError('Unknown Emoji: ' + errors.join(', '), context, subtag);
        return JSON.stringify([...new Set(users)]);
    }

    public enrichDocs(embed: MessageEmbedOptions): MessageEmbedOptions {
        embed.fields = [
            {
                name: 'Usage',
                value: '```\n{reactlist}```This just returns `No message found` ***always*** for the sake of backwards compatibility.\n\n' +
                    '**Example code:**\n> {reactlist}\n**Example out:**\n> `No message found`'
            },
            {
                name: '\u200b',
                value: '```\n{reactlist;[channelID];<messageID>}```\n`channelID` defaults to the current channel\n\n' +
                    'Returns an array of reactions on `messageid` in `channelID`.\n\n' +
                    '**Example code:**\n> {reactlist;111111111111111111}\n' +
                    '**Example out:**\n> ["🤔", "👀"]'
            },
            {
                name: '\u200b',
                value: '```\n{reactlist;[channelID];<messageID>;<reactions...>}```\n`channelID` defaults to the current channel\n\n' +
                    'Returns an array of users who reacted `reactions` on `messageID` in `channelID`. A user only needs to react to one reaction to be included in the resulting array.\n\n' +
                    '**Example code:**\n> {reactlist;111111111111111111;🤔;👀}\n> {reactlist;222222222222222222;111111111111111111;👀}\n' +
                    '**Example out:**\n> ["278237925009784832", "134133271750639616"]\n> ["134133271750639616"]'
            }
        ];

        return embed;
    }
}
