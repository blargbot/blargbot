import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { BBTagRuntimeError, ChannelNotFoundError, NotANumberError, UserNotFoundError } from '@cluster/bbtag/errors';
import { SubtagArgument } from '@cluster/types';
import { bbtagUtil, overrides, parse, SubtagType } from '@cluster/utils';
import { guard } from '@core/utils';
import { GuildChannels } from 'discord.js';

import { Statement } from '../../types';

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
                    returns: 'array',
                    execute: (ctx) => this.awaitMessage(ctx, ctx.channel.id, ctx.user.id)
                },
                {
                    parameters: ['channelIDs', 'userIDs?'],
                    description: 'Pauses the command until one of `userIDs` sends a message in one of `channelIDs`',
                    exampleCode: '{waitmessage;111111111111111;{userid;stupid cat}}',
                    exampleOut: '["111111111111111", "103347843934212096"]',
                    returns: 'array',
                    execute: (ctx, args) => this.awaitMessage(ctx, args[0].value, args[1].value)
                },
                {
                    parameters: ['channelIDs', 'userIDs', '~condition:true', 'timeout?:60'],
                    description: 'Pauses the command until `condition` returns true when one of `userIDs` sends a message in one of `channelIDs`.',
                    exampleCode: '{waitmessage;111111111111111;{userid;stupid cat};{bool;{username};startswith;stupid};50}',
                    exampleOut: '["111111111111111", "103347843934212096"]',
                    returns: 'array',
                    execute: (ctx, args) => this.awaitMessage(ctx, args[0].value, args[1].value, args[2], args[3].value)
                }
            ]
        });
    }

    public async awaitMessage(
        context: BBTagContext,
        channelStr: string,
        userStr: string,
        code?: SubtagArgument,
        timeoutStr?: string
    ): Promise<[channelId: string, messageId: string]> {
        // parse channels
        let channels;
        if (channelStr !== '') {
            let flattenedChannels;
            flattenedChannels = bbtagUtil.tagArray.flattenArray([channelStr]).map(i => parse.string(i));
            flattenedChannels = await Promise.all(flattenedChannels.map(async input => await context.queryChannel(input, { noLookup: true })));
            channels = flattenedChannels.filter((channel): channel is GuildChannels => channel !== undefined);
            if (flattenedChannels.length !== channels.length)
                throw new ChannelNotFoundError(channelStr);
            channels = channels.map(channel => channel.id);
        } else {
            channels = [context.channel.id];
        }
        // parse users
        let users;
        if (userStr !== '') {
            const flattenedUsers = bbtagUtil.tagArray.flattenArray([userStr]).map(i => parse.string(i));
            users = await Promise.all(flattenedUsers.map(async input => {
                const user = await context.queryUser(input, { noLookup: true });
                if (user === undefined)
                    throw new UserNotFoundError(input);
                return user.id;
            }));
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
        const result = await context.util.cluster.awaiter.messages.wait(channels, async message => {
            if (!userSet.has(message.author.id) || !guard.isGuildMessage(message))
                return false;

            const childContext = context.makeChild({ message });
            const result = parse.boolean(await childContext.eval(condition));
            return typeof result === 'boolean' ? result : false; //Feel like it should error if a non-boolean is returned
        }, timeout * 1000);

        if (result === undefined)
            throw new BBTagRuntimeError(`Wait timed out after ${timeout * 1000}`);
        return [result.channel.id, result.id];

    }
}
