import { BBTagContext, DefinedSubtag } from '@cluster/bbtag';
import { BBTagRuntimeError, ChannelNotFoundError, MessageNotFoundError } from '@cluster/bbtag/errors';
import { snowflake, SubtagType } from '@cluster/utils';
import { Emote } from '@core/Emote';
import { ApiError, DiscordRESTError, EmbedOptions } from 'eris';

export class ReactListSubtag extends DefinedSubtag {
    public constructor() {
        super({
            name: 'reactlist',
            category: SubtagType.MESSAGE,
            aliases: ['listreact'],
            definition: [//! overwritten
                {
                    parameters: [],
                    description: 'This just returns `No message found` ***always*** for the sake of backwards compatibility.',
                    returns: 'error',
                    execute: (ctx) => { throw new MessageNotFoundError(ctx.channel.id, ''); }
                },
                {
                    parameters: ['messageid'],
                    returns: 'string[]',
                    execute: (ctx, [messageid]) => this.getReactions(ctx, messageid.value)
                },
                {
                    parameters: ['arguments+2'],
                    returns: 'string[]',
                    execute: (ctx, args) => this.getReactionsOrReactors(ctx, ...this.bindArguments(ctx, args.map(arg => arg.value)))
                }
            ]
        });
    }

    public async getReactionsOrReactors(
        context: BBTagContext,
        channelStr: string,
        messageId: string,
        reactions: Emote[] | undefined
    ): Promise<Iterable<string>> {
        const channel = await context.queryChannel(channelStr, { noErrors: true, noLookup: true });
        if (channel === undefined)
            throw new ChannelNotFoundError(channelStr);

        const message = await context.util.getMessage(channel, messageId, true);
        if (message === undefined)
            throw new MessageNotFoundError(channel.id, messageId);

        if (reactions === undefined)
            return Object.keys(message.reactions);

        if (reactions.length === 0)
            throw new BBTagRuntimeError('Invalid Emojis');

        // List all users per reaction
        const users: string[] = [];
        const errors = [];
        for (const emote of reactions) {
            try {
                const reactionUsers = await message.getReaction(emote.toApi());
                users.push(...reactionUsers.map(u => u.id));
            } catch (err: unknown) {
                if (!(err instanceof DiscordRESTError) || err.code !== ApiError.UNKNOWN_EMOJI)
                    throw err;
                errors.push(emote);
            }
        }

        if (errors.length > 0)
            throw new BBTagRuntimeError('Unknown Emoji: ' + errors.join(', '));
        return [...new Set(users)];
    }

    private bindArguments(context: BBTagContext, args: string[]): [channel: string, message: string, reactions: Emote[] | undefined] {
        let channel = context.channel.id;
        let message = '';

        if (args.length >= 2 && snowflake.test(args[1]))
            channel = args.splice(0, 1)[0];

        message = args.splice(0, 1)[0];

        if (args.length === 0)
            return [channel, message, undefined];

        return [channel, message, args.flatMap(x => Emote.findAll(x))];
    }

    public async getReactions(context: BBTagContext, messageId: string): Promise<string[]> {
        const msg = await context.util.getMessage(context.channel, messageId, true);
        if (msg === undefined)
            throw new MessageNotFoundError(context.channel.id, messageId);
        return Object.keys(msg.reactions);
    }

    public enrichDocs(embed: EmbedOptions): EmbedOptions {
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
