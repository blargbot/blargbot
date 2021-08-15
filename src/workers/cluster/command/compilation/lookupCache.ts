import { CommandBinderParseResult, CommandBinderStateLookupCache, GuildCommandContext, LookupResult, PrivateCommandContext } from '@cluster/types';
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
            id => context.channel.guild.channels.cache.get(id) ?? 'NO_OPTIONS',
            async search => await context.util.queryChannel(context.channel, context.author, context.channel.guild, search)
        ),
        findUser: createLookup(
            command, '@!?', 'user',
            id => context.channel.guild.members.cache.get(id)?.user ?? 'NO_OPTIONS',
            async search => {
                const member = await context.util.queryMember(context.channel, context.author, context.channel.guild, search);
                return typeof member === 'string' ? member : member.user;
            }
        ),
        findRole: createLookup(
            command, '@&', 'role',
            id => context.channel.guild.roles.cache.get(id) ?? 'NO_OPTIONS',
            async search => await context.util.queryRole(context.channel, context.author, context.channel.guild, search)
        ),
        findMember: createLookup(
            command, '@!?', 'member',
            id => context.channel.guild.members.cache.get(id) ?? 'NO_OPTIONS',
            async search => await context.util.queryMember(context.channel, context.author, context.channel.guild, search)
        )
    };
}

function getPrivateLookupCache<TContext extends PrivateCommandContext>(context: TContext, command: BaseCommand): CommandBinderStateLookupCache {
    return {
        findChannel: createLookup(
            command, '#', 'channel',
            id => context.channel.id === id ? context.channel : 'NO_OPTIONS',
            search => context.util.channelMatchScore(context.channel, search) > 0
                ? context.channel
                : 'NO_OPTIONS'
        ),
        findUser: createLookup(
            command, '@!?', 'user',
            id => {
                if (id === context.channel.recipient.id)
                    return context.channel.recipient;
                if (id === context.discord.user.id)
                    return context.discord.user;
                return 'NO_OPTIONS';
            },
            search => context.util.userMatchScore(context.channel.recipient, search) > 0
                ? context.channel.recipient
                : 'NO_OPTIONS'
        ),
        findRole: createLookup<Role>(
            command, '@&', 'role',
            () => 'NO_OPTIONS',
            () => 'NO_OPTIONS'
        ),
        findMember: createLookup<GuildMember>(
            command, '@!?', 'member',
            () => 'NO_OPTIONS',
            () => 'NO_OPTIONS'
        )
    };
}

function createLookup<TResult extends Exclude<Primitive, string>>(
    command: BaseCommand,
    idTag: string,
    type: string,
    getById: (id: string) => LookupResult<TResult>,
    search: (searchString: string) => Promise<LookupResult<TResult>> | LookupResult<TResult>
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
            let result: CommandBinderParseResult<TResult>;
            switch (value) {
                case 'CANCELLED':
                case 'FAILED':
                case 'NO_OPTIONS':
                case 'TIMED_OUT':
                    result = { success: false, error: command.error(`A ${type} with id \`${id}\` does not exist`) };
                    break;
                default:
                    result = { success: true, value };
                    break;
            }
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
                let result: CommandBinderParseResult<TResult>;
                switch (value) {
                    case 'CANCELLED':
                    case 'FAILED':
                    case 'NO_OPTIONS':
                    case 'TIMED_OUT':
                        result = { success: false, error: command.error(`I could not find a ${type} matching \`${searchString}\``) };
                        break;
                    default:
                        result = { success: true, value };
                        break;
                }
                cache.set(key, result);
                return result;
            }
        };
        cache.set(key, result);
        return result;
    };
}
