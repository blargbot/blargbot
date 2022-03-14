import { BBTagContext, DefinedSubtag } from '@cluster/bbtag';
import { BBTagRuntimeError, ChannelNotFoundError, MessageNotFoundError, UserNotFoundError } from '@cluster/bbtag/errors';
import { SubtagArgumentArray } from '@cluster/types';
import { SubtagType } from '@cluster/utils';
import { Emote } from '@core/Emote';
import { ApiError, DiscordRESTError, EmbedField, EmbedOptions } from 'eris';

export class ReactRemoveSubtag extends DefinedSubtag {
    public constructor() {
        super({
            name: 'reactremove',
            category: SubtagType.MESSAGE,
            aliases: ['removereact'],
            definition: [//! overwritten
                {
                    parameters: ['arguments+'], // [channelID];<messageID>;[user];[reactions...]
                    returns: 'nothing',
                    execute: async (ctx, args) => await this.removeReactions(ctx, ...await this.bindArguments(ctx, args))
                }
            ]
        });
    }

    public async removeReactions(
        context: BBTagContext,
        channelStr: string,
        messageId: string,
        userStr: string,
        reactions: Emote[] | undefined
    ): Promise<void> {
        const channel = await context.queryChannel(channelStr, { noErrors: true, noLookup: true });
        if (channel === undefined)
            throw new ChannelNotFoundError(channelStr);

        const permissions = channel.permissionsOf(context.discord.user.id);
        if (!permissions.has('manageMessages'))
            throw new BBTagRuntimeError('I need to be able to Manage Messages to remove reactions');

        const message = await context.util.getMessage(channel, messageId, true);
        if (message === undefined)
            throw new MessageNotFoundError(channel.id, messageId);

        if (!context.ownsMessage(message.id) && !await context.isStaff)
            throw new BBTagRuntimeError('Author must be staff to modify unrelated messages');

        const user = await context.queryUser(userStr, { noErrors: true, noLookup: true });
        if (user === undefined)
            throw new UserNotFoundError(userStr);

        if (reactions?.length === 0)
            throw new BBTagRuntimeError('Invalid Emojis');
        reactions ??= Object.keys(message.reactions).map(Emote.parse);

        const errored = [];
        for (const reaction of reactions) {
            try {
                await context.limit.check(context, 'reactremove:requests');
                await message.removeReaction(reaction.toApi(), user.id);
            } catch (err: unknown) {
                if (!(err instanceof DiscordRESTError))
                    throw err;

                switch (err.code) {
                    case ApiError.UNKNOWN_EMOJI:
                        errored.push(reaction);
                        break;
                    case ApiError.MISSING_PERMISSIONS:
                        throw new BBTagRuntimeError('I need to be able to Manage Messages to remove reactions');
                    default:
                        throw err;
                }
            }
        }

        if (errored.length > 0)
            throw new BBTagRuntimeError('Unknown Emoji: ' + errored.join(', '));
    }

    private async bindArguments(context: BBTagContext, rawArgs: SubtagArgumentArray): Promise<[channel: string, message: string, user: string, reactions: Emote[] | undefined]> {
        const args = [...rawArgs];
        if (args.length === 1)
            return [context.channel.id, args[0].value, context.user.id, undefined];

        const channel = await context.queryChannel(args[0].value, { noLookup: true, noErrors: true });
        const channelId = channel?.id ?? context.channel.id;
        if (channel !== undefined)
            args.shift();

        const message = args.splice(0, 1)[0].value;
        if (args.length === 0)
            // {reactremove;<messageId>}
            // {reactremove;<channel>;<messageId>}
            return [channelId, message, context.user.id, undefined];

        const user = await context.queryUser(args[0].value, { noLookup: true, noErrors: true });
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

    public enrichDocs(embed: EmbedOptions): EmbedOptions {
        const limitField = <EmbedField>embed.fields?.pop();

        embed.fields = [
            {
                name: 'Usage',
                value: '```\n{reactremove;[channelID];<messageID>}```\n`channelID` defaults to the current channel if omitted\n\n' +
                    'Removes all reactions of the executing user from `messageID` in `channelID`.\n\n' +
                    '**Example code:**\n> {reactremove;12345678901234}\n' +
                    '**Example out:**\n> (removed all reactions on 12345678901234)'
            },
            {
                name: '\u200b',
                value: '```\n{reactremove;[channelID];<messageID>;[user];[reactions]}```\n`channelID` defaults to the current channel if omitted\n' +
                    '`reactions` defaults to all reactions if left blank or omitted\n\n' +
                    'Removes `reactions` `user` reacted on `messageID` in `channelID`.\n' +
                    '**Example code:**\n> {reactremove;12345678901234;111111111111111111;🤔}\n' +
                    '**Example out:**\n> (removed the 🤔 reaction on 12345678901234 from user 111111111111111111)'
            },
            {
                ...limitField
            }
        ];

        return embed;
    }
}
