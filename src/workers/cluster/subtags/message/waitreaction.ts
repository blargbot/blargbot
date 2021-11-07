import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { NotANumberError } from '@cluster/bbtag/errors';
import { Statement, SubtagArgumentValue, SubtagCall } from '@cluster/types';
import { bbtagUtil, overrides, parse, SubtagType } from '@cluster/utils';
import { guard } from '@core/utils';
import { User } from 'discord.js';

export class WaitReactionSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'waitreaction',
            category: SubtagType.MESSAGE,
            aliases: ['waitreact'],
            desc: 'Pauses the command until one of the given `users` adds any given `reaction` on any of the given `messages`. ' +
                'When a `reaction` is added, `condition` will be run to determine if the reaction can be accepted. ' +
                'If no reaction has been accepted within `timeout` then the subtag returns `Wait timed out`, otherwise it returns an array containing ' +
                'the channel Id, the message Id, the user id and the reaction, in that order. ' +
                '\n\n`userIDs` defaults to the current user if left blank or omitted.' +
                '\n`reactions` defaults to any reaction if left blank or omitted.' +
                '\n`condition` must return `true` or `false`, defaults to `true` if left blank or omitted' +
                '\n`timeout` is a number of seconds. This defaults to 60 if left blank or omitted, and is limited to 300' +
                '\n\n While inside the `condition` parameter, none of the following subtags may be used: `' + overrides.waitreaction.join(', ') + '`' +
                '\nAlso, the current message becomes the message the reaction was added to, and the user becomes the person who sent the message. ' +
                'This means that `{channelid}`, `{messageid}`, `{userid}` and all related subtags will change their values.' +
                '\nFinally, while inside the `condition` parameter, you can use the temporary subtag `{reaction}` to get the current reaction ' +
                'and the `{reactuser}` temporary subtag to get the user who reacted.\n' +
                '`messages`, `users` and `reactions` can either be single values eg: `{waitreact;1234567891234;stupid cat;🤔}`, or they can be arrays eg: `{waitreact;["1234567891234","98765432219876"];stupid cat;["🤔"]}',
            definition: [
                {
                    parameters: ['messages', 'userIDs?'],
                    description: 'Waits for any reaction on `messages` from the executing user or `userIDs` if provided.',
                    exampleCode: '{waitreaction;12345678912345;stupid cat}',
                    exampleIn: '(reaction is added)',
                    exampleOut: '["111111111111111","12345678912345","3333333333333","🤔"]',
                    execute: (ctx, args, subtag) => this.awaitReaction(ctx, subtag, args[0].value, args[1].value, '', 'true', '60')
                },
                {
                    parameters: ['messages', 'userIDs', 'reactions', '~condition?:true'],
                    description: 'Waits for any of `reactions` on `messages` from `userIDs`, if `condition` returns `true` this will return the response array.',
                    exampleCode: '{waitreaction;12345678912345;{userid;stupid cat};["🤔", "👀"];{bool;{reaction};==;👀}}',
                    exampleIn: '(🤔 was reacted)\n(👀 was reacted)',
                    exampleOut: '["111111111111111","12345678912345","3333333333333","👀"]',
                    execute: (ctx, args, subtag) => this.awaitReaction(ctx, subtag, args[0].value, args[1].value, args[2].value, args[3], '60')
                },
                {
                    parameters: ['messages', 'userIDs', 'reactions', '~condition:true', 'timeout:60'],
                    description: 'Waits for any of `reactions` on `messages` from `userIDs`, if `condition` returns `true` this will return the response array. If no reaction was matched within `timeout`, `Wait timed out` will be returned.',
                    exampleCode: '{waitreaction;12345678912345;["{userid;stupid cat}","{userid;titansmasher}"];["🤔", "👀"];;120}',
                    exampleIn: '(some random user reacted with 🤔)\n(titansmasher reacted with 🤔)',
                    exampleOut: '["111111111111111","12345678912345","135556895086870528","🤔"]',
                    execute: (ctx, args, subtag) => this.awaitReaction(ctx, subtag, args[0].value, args[1].value, args[2].value, args[3], args[4].value)
                }
            ]
        });
    }

    public async awaitReaction(
        context: BBTagContext,
        subtag: SubtagCall,
        messageStr: string,
        userIDStr: string,
        reactions: string,
        code: SubtagArgumentValue | string,
        timeoutStr: string
    ): Promise<string | void> {
        // get messages
        const messages = bbtagUtil.tagArray.flattenArray([messageStr]).map(i => parse.string(i));

        // parse users
        let users;
        if (userIDStr !== '') {
            let flattenedUsers: string[] | Array<User | undefined> = bbtagUtil.tagArray.flattenArray([userIDStr]).map(i => parse.string(i));
            flattenedUsers = await Promise.all(flattenedUsers.map(async input => await context.queryUser(input, { noErrors: true, noLookup: true })));
            users = flattenedUsers.filter((user): user is User => user !== undefined);
            if (users.length !== flattenedUsers.length)
                return this.noUserFound(context, subtag);
            users = users.map(user => user.id);
        } else {
            users = [context.user.id];
        }

        // parse reactions
        let parsedReactions;
        if (reactions !== '') {
            parsedReactions = bbtagUtil.tagArray.flattenArray([reactions]).map(i => parse.string(i));
            parsedReactions = [...new Set(parsedReactions.flatMap(i => parse.emoji(i)))];
            if (parsedReactions.length === 0)
                return this.customError('Invalid Emojis', context, subtag);
        } else {
            parsedReactions = undefined;
        }

        // parse check code
        let condition: Statement;
        if (typeof code === 'string') {
            condition = bbtagUtil.parse(code);
        } else {
            condition = bbtagUtil.parse(code.raw);
        }

        // parse timeout
        let timeout;
        if (timeoutStr !== '') {
            timeout = parse.float(timeoutStr, false);
            if (timeout === undefined)
                throw new NotANumberError(timeoutStr);
            if (timeout < 0)
                timeout = 0;
            if (timeout > 300)
                timeout = 300;
        } else {
            timeout = 60;
        }

        const userSet = new Set(users);
        const reactionSet = new Set(parsedReactions);
        const checkReaction = reactionSet.size === 0 ? () => true : (emoji: string) => reactionSet.has(emoji);
        const reaction = await context.util.cluster.awaiter.reactions.wait(messages, async ({ user, reaction, message }) => {
            if (!userSet.has(user.id) || !checkReaction(reaction.emoji.toString()) || !guard.isGuildMessage(message))
                return false;

            context.scopes.pushScope();
            context.scopes.local.reaction = reaction.emoji.toString();
            context.scopes.local.reactUser = user.id;
            const childContext = context.makeChild({ message });
            const result = parse.boolean(await childContext.eval(condition));
            return typeof result === 'boolean' ? result : false; //Feel like it should error if a non-boolean is returned
        }, timeout * 1000);

        if (reaction === undefined)
            return this.customError(`Wait timed out after ${timeout * 1000}`, context, subtag);
        return JSON.stringify([reaction.message.channel.id, reaction.message.id, reaction.user.id, reaction.reaction.emoji.toString()]);
    }
}
