import { CommandBinderParseResult, CommandBinderStateLookupCache, CommandVariableTypeMap, GuildCommandContext, PrivateCommandContext } from '@cluster/types';
import { guard } from '@cluster/utils';
import { GuildMember } from 'discord.js';

import { CommandContext } from '../CommandContext';
import { createCommandArgument } from './commandArgument';

export function getLookupCache<TContext extends CommandContext>(context: TContext): CommandBinderStateLookupCache {
    if (guard.isGuildCommandContext(context))
        return getGuildLookupCache(context);

    if (guard.isPrivateCommandContext(context))
        return getPrivateLookupCache(context);

    throw new Error('Unsupported command context');
}

function getGuildLookupCache<TContext extends GuildCommandContext>(context: TContext): CommandBinderStateLookupCache {
    return {
        findChannel: createLookup(
            'channel',
            'a channel',
            async query => (await context.util.findChannels(context.channel.guild, query)).filter(guard.isTextableChannel),
            async (options, query) => {
                const result = await context.queryChannel({ choices: options, filter: query });
                return result.state === 'SUCCESS' ? result.value : undefined;
            }
        ),
        findUser: createLookup(
            'user',
            'a user',
            async query => (await context.util.findMembers(context.channel.guild, query)).map(m => m.user),
            async (options, query) => {
                const result = await context.queryUser({ choices: options, filter: query });
                return result.state === 'SUCCESS' ? result.value : undefined;
            }
        ),
        findSender: createLookup(
            'sender',
            'a sender',
            async query => (await context.util.findSenders(context.channel.guild, query)).map(s => s instanceof GuildMember ? s.user : s),
            async (options, query) => {
                const result = await context.querySender({ choices: options, filter: query });
                return result.state === 'SUCCESS' ? result.value : undefined;
            }
        ),
        findRole: createLookup(
            'role',
            'a role',
            query => context.util.findRoles(context.channel.guild, query),
            async (options, query) => {
                const result = await context.queryRole({ choices: options, filter: query });
                return result.state === 'SUCCESS' ? result.value : undefined;
            }
        ),
        findMember: createLookup(
            'member',
            'a member',
            query => context.util.findMembers(context.channel.guild, query),
            async (options, query) => {
                const result = await context.queryMember({ choices: options, filter: query });
                return result.state === 'SUCCESS' ? result.value : undefined;
            }
        )
    };
}

function getPrivateLookupCache<TContext extends PrivateCommandContext>(context: TContext): CommandBinderStateLookupCache {
    return {
        findChannel: createLookup(
            'channel',
            'a channel',
            query => [
                context.channel
            ].filter(c => context.util.channelMatchScore(c, query) > 0),
            async (options, query) => {
                const result = await context.queryChannel({ choices: options, filter: query });
                return result.state === 'SUCCESS' ? result.value : undefined;
            }
        ),
        async findSender(str) {
            return await this.findUser(str);
        },
        findUser: createLookup(
            'user',
            'a user',
            query => [
                context.channel.recipient,
                context.discord.user
            ].filter(u => context.util.userMatchScore(u, query) > 0),
            async (options, query) => {
                const result = await context.queryUser({ choices: options, filter: query });
                return result.state === 'SUCCESS' ? result.value : undefined;
            }
        ),
        findRole: createLookup(
            'role',
            'a role',
            () => [],
            () => undefined
        ),
        findMember: createLookup(
            'member',
            'a member',
            () => [],
            () => undefined
        )
    };
}

function createLookup<K extends keyof CommandVariableTypeMap>(
    key: K,
    type: string,
    search: (query: string) => Array<CommandVariableTypeMap[K]> | Promise<Array<CommandVariableTypeMap[K]>>,
    select: (options: Array<CommandVariableTypeMap[K]>, query: string) => Promise<CommandVariableTypeMap[K] | undefined> | CommandVariableTypeMap[K] | undefined
): (query: string) => Awaitable<CommandBinderParseResult> {
    const cache = new Map<string, CommandBinderParseResult>();
    return async query => {
        const normQuery = query.toLowerCase();
        const current = cache.get(normQuery);
        if (current !== undefined)
            return current;

        const matches = await search(query);
        let result: CommandBinderParseResult;
        switch (matches.length) {
            case 0:
                result = { success: false, error: { parseFailed: { attemptedValue: query, types: [type] } } };
                break;
            case 1:
                result = { success: true, value: createCommandArgument(key, matches[0]) };
                break;
            default:
                result = {
                    success: 'deferred',
                    async getValue() {
                        const current = cache.get(normQuery);
                        if (current !== undefined && current.success !== 'deferred')
                            return current;

                        const value = await select(matches, query);
                        const result: CommandBinderParseResult = value === undefined
                            ? { success: false, error: { parseFailed: { attemptedValue: query, types: [type] } } }
                            : { success: true, value: createCommandArgument(key, value) };

                        cache.set(normQuery, result);
                        return result;
                    }
                };
                break;
        }

        cache.set(normQuery, result);
        return result;
    };
}
