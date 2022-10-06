import { Emote } from '@blargbot/core/Emote';
import { ApiError, DiscordRESTError } from 'eris';

import { SubtagArgumentArray } from '../../arguments';
import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { BBTagRuntimeError, ChannelNotFoundError, MessageNotFoundError, UserNotFoundError } from '../../errors';
import { SubtagType } from '../../utils';

export class ReactRemoveSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: `reactremove`,
            category: SubtagType.MESSAGE,
            aliases: [`removereact`],
            definition: [
                {
                    parameters: [`arguments+`],
                    returns: `nothing`,
                    execute: async (ctx, args) => await this.removeReactions(ctx, ...await this.#bindArguments(ctx, args))
                },
                {
                    parameters: [`channel?`, `messageId`],
                    description: `Removes all reactions of the executing user from \`messageID\` in \`channel\`.`,
                    exampleCode: `{reactremove;12345678901234}`,
                    exampleOut: `(removed all reactions on 12345678901234)`
                },
                {
                    parameters: [`channel?`, `messageId`, `reactions+`],
                    description: `Removes \`reactions\` \`user\` reacted on \`messageID\` in \`channel\`.`,
                    exampleCode: `{reactremove;12345678901234;111111111111111111;🤔}`,
                    exampleOut: `(removed the 🤔 reaction on 12345678901234 from user 111111111111111111)`
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
        if (!permissions.has(`manageMessages`))
            throw new BBTagRuntimeError(`I need to be able to Manage Messages to remove reactions`);

        const message = await context.getMessage(channel, messageId, true);
        if (message === undefined)
            throw new MessageNotFoundError(channel.id, messageId);

        if (!context.ownsMessage(message.id) && !await context.isStaff)
            throw new BBTagRuntimeError(`Author must be staff to modify unrelated messages`);

        const user = await context.queryUser(userStr, { noErrors: true, noLookup: true });
        if (user === undefined)
            throw new UserNotFoundError(userStr);

        if (reactions?.length === 0)
            throw new BBTagRuntimeError(`Invalid Emojis`);
        reactions ??= Object.keys(message.reactions).map(Emote.parse);

        const errored = [];
        for (const reaction of reactions) {
            try {
                await context.limit.check(context, `reactremove:requests`);
                await message.removeReaction(reaction.toApi(), user.id);
            } catch (err: unknown) {
                if (!(err instanceof DiscordRESTError))
                    throw err;

                switch (err.code) {
                    case ApiError.UNKNOWN_EMOJI:
                        errored.push(reaction);
                        break;
                    case ApiError.MISSING_PERMISSIONS:
                        throw new BBTagRuntimeError(`I need to be able to Manage Messages to remove reactions`);
                    default:
                        throw err;
                }
            }
        }

        if (errored.length > 0)
            throw new BBTagRuntimeError(`Unknown Emoji: ${  errored.join(`, `)}`);
    }

    async #bindArguments(context: BBTagContext, rawArgs: SubtagArgumentArray): Promise<[channel: string, message: string, user: string, reactions: Emote[] | undefined]> {
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
}
