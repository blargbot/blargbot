import { CommandBinderParseResult, CommandBinderStateLookupCache, CommandBinderValue, GuildCommandContext, PrivateCommandContext } from '@cluster/types';
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
            command, '#',
            id => context.channel.guild.channels.cache.get(id) ?? `A channel with id \`${id}\` doesnt exist`,
            async search => await context.util.getChannel(context.message, search) ?? `I could not find the channel \`${search}\``),
        findUser: createLookup(
            command, '@!?',
            id => context.channel.guild.members.cache.get(id)?.user ?? `A user with id \`${id}\` doesnt exist`,
            async search => await context.util.getUser(context.message, search) ?? `I could not find the user \`${search}\``),
        findRole: createLookup(
            command, '@&',
            id => context.channel.guild.roles.cache.get(id) ?? `A role with id \`${id}\` doesnt exist`,
            async search => await context.util.getRole(context.message, search) ?? `I could not find the role \`${search}\``),
        findMember: createLookup(
            command, '@!?',
            id => context.channel.guild.members.cache.get(id) ?? `A user with id \`${id}\` doesnt exist`,
            async search => await context.util.getMember(context.message, search) ?? `I could not find the user \`${search}\``)
    };
}

function getPrivateLookupCache<TContext extends PrivateCommandContext>(context: TContext, command: BaseCommand): CommandBinderStateLookupCache {
    return {
        findChannel: createLookup(
            command, '#',
            id => context.channel.id === id ? context.channel : `A channel with id \`${id}\` doesnt exist`,
            async search => await context.util.getChannel(context.message, search) ?? `I could not find the channel \`${search}\``),
        findUser: createLookup(
            command, '@!?',
            id => context.channel.recipient.id === id ? context.channel.recipient : `A user with id \`${id}\` doesnt exist`,
            async search => await context.util.getUser(context.message, search) ?? `I could not find the user \`${search}\``),
        findRole: createLookup<Role>(
            command, '@&',
            id => `A role with id \`${id}\` doesnt exist`,
            search => `I could not find the role \`${search}\``),
        findMember: createLookup<GuildMember>(
            command, '@!?',
            () => 'I cant find guild members in a private channel!',
            () => 'I cant find guild members in a private channel!')
    };
}

function createLookup<TResult>(
    command: BaseCommand,
    idTag: string,
    getById: (id: string) => TResult | string,
    search: (searchString: string) => Promise<TResult | string> | TResult | string
): (searchString: string) => CommandBinderParseResult<TResult> {
    const cache = new Map<string, CommandBinderParseResult<TResult>>();
    return searchString => {
        const key = searchString.toLowerCase();
        const current = cache.get(key);
        if (current !== undefined)
            return current;

        const id = parse.entityId(searchString, idTag);
        if (id !== undefined) {
            const value = getById(id);
            const result: CommandBinderValue<TResult> = typeof value === 'string'
                ? { success: false, error: command.error(value) }
                : { success: true, value: value };
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
                const result: CommandBinderValue<TResult> = typeof value === 'string'
                    ? { success: false, error: command.error(value) } as const
                    : { success: true, value: value } as const;
                cache.set(key, result);
                return result;
            }
        };
        cache.set(key, result);
        return result;
    };
}
