import { CommandBinderParseResult, CommandBinderStateLookupCache, GuildCommandContext, PrivateCommandContext } from '@cluster/types';
import { guard } from '@cluster/utils';
import { GuildMember, Role } from 'discord.js';

import { BaseCommand } from '../BaseCommand';
import { CommandContext } from '../CommandContext';

export function getLookupCache<TContext extends CommandContext>(context: TContext, command: BaseCommand): CommandBinderStateLookupCache {
    if (guard.isGuildCommandContext(context))
        return getGuildLookupCache(context, command);

    if (guard.isPrivateCommandContext(context))
        return getPrivateLookupCache(context, command);

    throw new Error('Unsupported command context');
}

function getGuildLookupCache<TContext extends GuildCommandContext>(context: TContext, command: BaseCommand): CommandBinderStateLookupCache {
    return {
        findChannel: createLookup(
            command, 'channel',
            async query => (await context.util.findChannels(context.channel.guild, query)).filter(guard.isTextableChannel),
            async (options, query) => {
                const result = await context.queryChannel({ choices: options, filter: query });
                return result.state === 'SUCCESS' ? result.value : undefined;
            }
        ),
        findUser: createLookup(
            command, 'user',
            async query => (await context.util.findMembers(context.channel.guild, query)).map(m => m.user),
            async (options, query) => {
                const result = await context.queryUser({ choices: options, filter: query });
                return result.state === 'SUCCESS' ? result.value : undefined;
            }
        ),
        findRole: createLookup(
            command, 'role',
            query => context.util.findRoles(context.channel.guild, query),
            async (options, query) => {
                const result = await context.queryRole({ choices: options, filter: query });
                return result.state === 'SUCCESS' ? result.value : undefined;
            }
        ),
        findMember: createLookup(
            command, 'member',
            query => context.util.findMembers(context.channel.guild, query),
            async (options, query) => {
                const result = await context.queryMember({ choices: options, filter: query });
                return result.state === 'SUCCESS' ? result.value : undefined;
            }
        )
    };
}

function getPrivateLookupCache<TContext extends PrivateCommandContext>(context: TContext, command: BaseCommand): CommandBinderStateLookupCache {
    return {
        findChannel: createLookup(
            command, 'channel',
            query => [
                context.channel
            ].filter(c => context.util.channelMatchScore(c, query) > 0),
            async (options, query) => {
                const result = await context.queryChannel({ choices: options, filter: query });
                return result.state === 'SUCCESS' ? result.value : undefined;
            }
        ),
        findUser: createLookup(
            command, 'user',
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
            command, 'role',
            () => [],
            () => undefined
        ),
        findMember: createLookup<GuildMember>(
            command, 'member',
            () => [],
            () => undefined
        )
    };
}

function createLookup<TResult>(
    command: BaseCommand,
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
                result = { success: false, error: command.error(`I could not find a ${type} matching \`${query}\``) } as const;
                break;
            case 1:
                result = { success: true, value: matches[0] } as const;
                break;
            default:
                result = {
                    success: 'deferred',
                    async getValue() {
                        const current = cache.get(key);
                        if (current !== undefined && current.success !== 'deferred')
                            return current;

                        const value = await select(matches, query);
                        const result = value === undefined
                            ? { success: false, error: command.error(`I could not find a ${type} matching \`${query}\``) } as const
                            : { success: true, value: value } as const;

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
