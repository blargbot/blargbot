import { CommandBinderParseResult, CommandBinderStateLookupCache, GuildCommandContext, PrivateCommandContext } from '@cluster/types';
import { guard, parse } from '@cluster/utils';
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
            command, '#', 'channel',
            id => context.channel.guild.channels.cache.get(id),
            async search => {
                const result = await context.util.queryChannel(context.channel, context.author, context.channel.guild, search);
                return result.state === 'SUCCESS' ? result.value : undefined;
            }
        ),
        findUser: createLookup(
            command, '@!?', 'user',
            id => context.channel.guild.members.cache.get(id)?.user,
            async search => {
                const result = await context.util.queryMember(context.channel, context.author, context.channel.guild, search);
                return result.state === 'SUCCESS' ? result.value.user : undefined;
            }
        ),
        findRole: createLookup(
            command, '@&', 'role',
            id => context.channel.guild.roles.cache.get(id),
            async search => {
                const result = await context.util.queryRole(context.channel, context.author, context.channel.guild, search);
                return result.state === 'SUCCESS' ? result.value : undefined;
            }
        ),
        findMember: createLookup(
            command, '@!?', 'member',
            id => context.channel.guild.members.cache.get(id),
            async search => {
                const result = await context.util.queryMember(context.channel, context.author, context.channel.guild, search);
                return result.state === 'SUCCESS' ? result.value : undefined;
            }
        )
    };
}

function getPrivateLookupCache<TContext extends PrivateCommandContext>(context: TContext, command: BaseCommand): CommandBinderStateLookupCache {
    return {
        findChannel: createLookup(
            command, '#', 'channel',
            id => context.channel.id === id ? context.channel : undefined,
            search => context.util.channelMatchScore(context.channel, search) > 0
                ? context.channel
                : undefined
        ),
        findUser: createLookup(
            command, '@!?', 'user',
            id => {
                if (id === context.channel.recipient.id)
                    return context.channel.recipient;
                if (id === context.discord.user.id)
                    return context.discord.user;
                return undefined;
            },
            search => context.util.userMatchScore(context.channel.recipient, search) > 0 ? context.channel.recipient : undefined
        ),
        findRole: createLookup<Role>(
            command, '@&', 'role',
            () => undefined,
            () => undefined
        ),
        findMember: createLookup<GuildMember>(
            command, '@!?', 'member',
            () => undefined,
            () => undefined
        )
    };
}

function createLookup<TResult>(
    command: BaseCommand,
    idTag: string,
    type: string,
    getById: (id: string) => TResult | undefined,
    search: (searchString: string) => Promise<TResult | undefined> | TResult | undefined
): (searchString: string) => CommandBinderParseResult<TResult> {
    const cache = new Map<string, CommandBinderParseResult<TResult>>();
    return searchString => {
        const key = searchString.toLowerCase();
        const current = cache.get(key);
        if (current !== undefined)
            return current;

        const id = parse.entityId(searchString, idTag, true);
        if (id !== undefined) {
            const value = getById(id);
            const result = value === undefined
                ? { success: false, error: command.error(`A ${type} with id \`${id}\` does not exist`) } as const
                : { success: true, value: value } as const;
            cache.set(key, result);
            return result;
        }

        const result: CommandBinderParseResult<TResult> = {
            success: 'deferred',
            async getValue() {
                const current = cache.get(key);
                if (current !== undefined && current.success !== 'deferred')
                    return current;

                const value = await search(searchString);
                const result = value === undefined
                    ? { success: false, error: command.error(`I could not find a ${type} matching \`${searchString}\``) } as const
                    : { success: true, value: value } as const;

                cache.set(key, result);
                return result;
            }
        };
        cache.set(key, result);
        return result;
    };
}
