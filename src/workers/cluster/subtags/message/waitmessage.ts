import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { SubtagArgumentValue, SubtagCall } from '@cluster/types';
import { bbtagUtil, overrides, parse, SubtagType } from '@cluster/utils';
import { GuildChannels, GuildMessage, User } from 'discord.js';

import { Statement } from './../../types';

export class WaitMessageSubtags extends BaseSubtag {
    public constructor() {
        super({
            name: 'waitmessage',
            category: SubtagType.MESSAGE,
            desc: 'Pauses the command until one of the given users sends a message in any of the given channels. ' +
            'When a message is sent, `condition` will be run to determine if the message can be accepted. ' +
            'If no message has been accepted within `timeout` then the subtag returns `Wait timed out`, otherwise it returns an array containing ' +
            'the channel Id, then the message Id. ' +
            '\n\n`channels` defaults to the current channel.' +
            '\n`users` defaults to the current user.' +
            '\n`condition` must return `true` or `false` and defaults to `true`' +
            '\n`timeout` is a number of seconds. This defaults to 60 and is limited to 300' +
            '\n\n While inside the `condition` parameter, none of the following subtags may be used: `' + overrides.waitmessage.join(', ') + '`' +
            '\nAlso, the current message becomes the users message that is to be checked. This means that ' +
            '`{channelid}`, `{messageid}`, `{userid}` and all related subtags will change their values.',
            definition: [
                {
                    parameters: [],
                    description: 'Pauses the command until the executing user sends a message in the current channel.',
                    exampleCode: '{waitmessage}',
                    exampleOut: '["111111111111111","2222222222222"]',
                    execute: (ctx, _, subtag) => this.awaitMessage(ctx, subtag, ctx.channel.id, ctx.user.id)
                },
                {
                    parameters: ['channelIDs', 'userIDs?'],
                    description: 'Pauses the command until one of `userIDs` sends a message in one of `channelIDs`',
                    exampleCode: '{waitmessage;111111111111111;{userid;stupid cat}}',
                    exampleOut: '["111111111111111", "103347843934212096"]',
                    execute: (ctx, args, subtag) => this.awaitMessage(ctx, subtag, args[0].value, args[1].value)
                },
                {
                    parameters: ['channelIDs', 'userIDs', '~condition:true', 'timeout?:60'],
                    description: 'Pauses the command until `condition` returns true when one of `userIDs` sends a message in one of `channelIDs`.',
                    exampleCode: '{waitmessage;111111111111111;{userid;stupid cat};{bool;{username};startswith;stupid};50}',
                    exampleOut: '["111111111111111", "103347843934212096"]',
                    execute: (ctx, args, subtag) => this.awaitMessage(ctx, subtag, args[0].value, args[1].value, args[2], args[3].value)
                }
            ]
        });
    }

    public async awaitMessage(
        context: BBTagContext,
        subtag: SubtagCall,
        channelStr: string,
        userStr: string,
        code?: SubtagArgumentValue,
        timeoutStr?: string
    ): Promise<string> {
        // parse channels
        let channels;
        if (channelStr !== '') {
            let flattenedChannels;
            flattenedChannels = bbtagUtil.tagArray.flattenArray([channelStr]).map(i => parse.string(i));
            flattenedChannels = await Promise.all(flattenedChannels.map(async input => await context.queryChannel(input, {noLookup: true})));
            channels = flattenedChannels.filter((channel): channel is GuildChannels => channel !== undefined);
            if (flattenedChannels.length !== channels.length)
                return this.channelNotFound(context, subtag);
            channels = channels.map(channel => channel.id);
        } else {
            channels = [context.channel.id];
        }
        // parse users
        let users;
        if (userStr !== '') {
            let flattenedUsers;
            flattenedUsers = bbtagUtil.tagArray.flattenArray([userStr]).map(i => parse.string(i));
            flattenedUsers = await Promise.all(flattenedUsers.map(async input => await context.queryUser(input, { noLookup: true})));
            users = flattenedUsers.filter((user): user is User => user !== undefined);
            if (users.length !== flattenedUsers.length)
                return this.noUserFound(context, subtag);
            users = users.map(user => user.id);
        } else {
            users = [context.user.id];
        }

        // parse check code
        let condition: Statement;
        if (code !== undefined) {
            condition = bbtagUtil.parse(code.raw);
        } else {
            condition = bbtagUtil.parse('true');
        }

        // parse timeout
        let timeout;
        if (timeoutStr !== undefined) {
            timeout = parse.float(timeoutStr);
            if (isNaN(timeout))
                return this.notANumber(context, subtag);
            if (timeout < 0)
                timeout = 0;
            if (timeout > 300)
                timeout = 300;
        } else {
            timeout = 60;
        }

        const subtagOverrides = [];
        for (const name of overrides.waitmessage) {
            subtagOverrides.push(context.override(name, {
                execute: (_context: BBTagContext, subtagName: string, _subtag: SubtagCall) => {
                    return this.customError(`Subtag {${subtagName}} is disabled inside {waitmessage}`, _context, _subtag);
                }
            }));
        }

        const checkFunc = async (message: GuildMessage): Promise<boolean> => {
            const childContext = context.makeChild({message});
            const result = parse.boolean(await childContext.eval(condition));
            return typeof result === 'boolean' ? result : false; //Feel like it should error if a non-boolean is returned
        };

        const result = await context.util.cluster.await.messages.awaitTagMessage(channels, users, checkFunc, timeout * 1000);
        for (const override of subtagOverrides)
            override.revert();
        if (typeof result === 'string')
            return this.customError(result, context, subtag);
        return JSON.stringify([result.channel.id, result.id]);

    }
}
