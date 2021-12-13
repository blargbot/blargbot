import { BBTagContext, Subtag } from '@cluster/bbtag';
import { BBTagRuntimeError, MessageNotFoundError } from '@cluster/bbtag/errors';
import { parse, SubtagType } from '@cluster/utils';
import { ApiError, DiscordRESTError, EmbedField, EmbedOptions } from 'eris';

export class ReactRemoveSubtag extends Subtag {
    public constructor() {
        super({
            name: 'reactremove',
            category: SubtagType.MESSAGE,
            aliases: ['removereact'],
            definition: [//! overwritten
                {
                    parameters: ['channelID?', 'messageID'], // [channelID];<messageID>;[user];[reactions...]
                    returns: 'nothing',
                    execute: (ctx, args) => this.removeReactions(ctx, args.map(arg => arg.value))
                },
                {
                    parameters: ['channelID', 'messageID', 'user', 'reactions+'], // [channelID];<messageID>;[user];[reactions...]
                    returns: 'nothing',
                    execute: (ctx, args) => this.removeReactions(ctx, args.map(arg => arg.value))
                }
            ]
        });
    }

    public async removeReactions(
        context: BBTagContext,
        args: string[]
    ): Promise<void> {
        let channel;
        let message;
        // Check if the first "emote" is actually a valid channel
        channel = await context.queryChannel(args[0], { noLookup: true });
        if (channel === undefined)
            channel = context.channel;
        else
            args.shift();
        const permissions = channel.permissionsOf(context.discord.user.id);
        if (!permissions.has('manageMessages'))
            throw new BBTagRuntimeError('I need to be able to Manage Messages to remove reactions');
        // Check that the current first "emote" is a message id
        try {
            message = await context.util.getMessage(channel, args[0]);
        } catch (e: unknown) {
            // NOOP
        }
        args.shift();
        if (message === undefined)
            throw new MessageNotFoundError(channel, args[0]);

        if (!(await context.isStaff || context.ownsMessage(message.id)))
            throw new BBTagRuntimeError('Author must be staff to modify unrelated messages');

        // Loop through the "emotes" and check if each is a user. If it is not, then break
        let user = await context.queryUser(args[0], { noErrors: context.scopes.local.noLookupErrors, noLookup: true });
        if (user === undefined)
            user = context.user;
        else
            args.shift();
        // Find all actual emotes in remaining emotes
        let parsedEmojis = parse.emoji(args.join('|'), true);

        if (parsedEmojis.length === 0 && args.length !== 0)
            throw new BBTagRuntimeError('Invalid Emojis');

        // Default to all emotes
        if (parsedEmojis.length === 0)
            parsedEmojis = Object.keys(message.reactions);

        const errored = [];
        for (const reaction of parsedEmojis) {
            try {
                await context.limit.check(context, 'reactremove:requests');
                await message.removeReaction(reaction, user.id);
            } catch (err: unknown) {
                if (err instanceof DiscordRESTError) {
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
        }

        if (errored.length > 0)
            throw new BBTagRuntimeError('Unknown Emoji: ' + errored.join(', '));
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
                value: '```\n{reactremove;[channelID];<messageID>;<user>;[reactions]}```\n`channelID` defaults to the current channel if omitted\n' +
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
