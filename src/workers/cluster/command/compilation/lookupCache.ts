import { CommandBinderParseResult, CommandBinderStateLookupCache, GuildCommandContext, PrivateCommandContext } from '@cluster/types';
import { guard } from '@cluster/utils';
import { GuildMember, Role } from 'discord.js';

import { CommandContext } from '../CommandContext';

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
            async query => (await context.util.findChannels(context.channel.guild, query)).filter(guard.isTextableChannel),
            async (options, query) => {
                const result = await context.queryChannel({ choices: options, filter: query });
                return result.state === 'SUCCESS' ? result.value : undefined;
            }
        ),
        findUser: createLookup(
            'user',
            async query => (await context.util.findMembers(context.channel.guild, query)).map(m => m.user),
            async (options, query) => {
                const result = await context.queryUser({ choices: options, filter: query });
                return result.state === 'SUCCESS' ? result.value : undefined;
            }
        ),
        findSender: createLookup(
            'sender',
            async query => (await context.util.findSenders(context.channel.guild, query)).map(s => s instanceof GuildMember ? s.user : s),
            async (options, query) => {
                const result = await context.querySender({ choices: options, filter: query });
                return result.state === 'SUCCESS' ? result.value : undefined;
            }
        ),
        findRole: createLookup(
            'role',
            query => context.util.findRoles(context.channel.guild, query),
            async (options, query) => {
                const result = await context.queryRole({ choices: options, filter: query });
                return result.state === 'SUCCESS' ? result.value : undefined;
            }
        ),
        findMember: createLookup(
            'member',
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
            query => [
                context.channel.recipient,
                context.discord.user
            ].filter(u => context.util.userMatchScore(u, query) > 0),
            async (options, query) => {
                const result = await context.queryUser({ choices: options, filter: query });
                return result.state === 'SUCCESS' ? result.value : undefined;
            }
        ),
        findRole: createLookup<Role>(
            'role',
            () => [],
            () => undefined
        ),
        findMember: createLookup<GuildMember>(
            'member',
            () => [],
            () => undefined
        )
    };
}

function createLookup<TResult>(
    type: string,
    search: (query: string) => TResult[] | Promise<TResult[]>,
    select: (options: TResult[], query: string) => Promise<TResult | undefined> | TResult | undefined
): (query: string) => Awaitable<CommandBinderParseResult<TResult>> {
    const cache = new Map<string, CommandBinderParseResult<TResult>>();
    return async query => {
        const key = query.toLowerCase();
        const current = cache.get(key);
        if (current !== undefined)
            return current;

        const matches = await search(query);
        let result: CommandBinderParseResult<TResult>;
        switch (matches.length) {
            case 0:
                result = { success: false, error: { parseFailed: { attemptedValue: query, types: [`a ${type}`] } } };
                break;
            case 1:
                result = { success: true, value: matches[0] };
                break;
            default:
                result = {
                    success: 'deferred',
                    async getValue() {
                        const current = cache.get(key);
                        if (current !== undefined && current.success !== 'deferred')
                            return current;

                        const value = await select(matches, query);
                        const result: CommandBinderParseResult<TResult> = value === undefined
                            ? { success: false, error: { parseFailed: { attemptedValue: query, types: [`a ${type}`] } } }
                            : { success: true, value: value };

                        cache.set(key, result);
                        return result;
                    }
                };
                break;
        }

        cache.set(key, result);
        return result;
    };
}
