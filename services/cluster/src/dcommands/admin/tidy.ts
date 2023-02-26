import type { CommandResult, GuildCommandContext } from '@blargbot/cluster/types.js';
import { CommandType } from '@blargbot/cluster/utils/index.js';
import { createSafeRegExp } from '@blargbot/core/utils/index.js';
import { invite } from '@blargbot/discord-util';
import * as Eris from 'eris';
import moment from 'moment-timezone';

import { GuildCommand, SingleThreadMiddleware } from '../../command/index.js';
import templates from '../../text.js';

const cmd = templates.commands.tidy;

export class TidyCommand extends GuildCommand {
    public constructor() {
        super({
            name: 'tidy',
            category: CommandType.ADMIN,
            flags: [
                { flag: 'b', word: 'bots', description: cmd.flags.bots },
                { flag: 'i', word: 'invites', description: cmd.flags.invites },
                { flag: 'l', word: 'links', description: cmd.flags.links },
                { flag: 'e', word: 'embeds', description: cmd.flags.embeds },
                { flag: 'a', word: 'attachments', description: cmd.flags.attachments },
                { flag: 'u', word: 'user', description: cmd.flags.user },
                { flag: 'q', word: 'query', description: cmd.flags.query },
                { flag: 'I', word: 'invert', description: cmd.flags.invert },
                { flag: 'y', word: 'yes', description: cmd.flags.yes }
            ],
            definitions: [
                {
                    parameters: '{count:integer=100}',
                    description: cmd.default.description,
                    execute: (ctx, [count], flags) => this.tidy(ctx, count.asInteger, {
                        botsOnly: flags.b !== undefined,
                        invites: flags.i !== undefined,
                        links: flags.l !== undefined,
                        embeds: flags.e !== undefined,
                        attachments: flags.a !== undefined,
                        users: flags.u?.merge().raw.split(',').map(s => s.trim()),
                        query: flags.q?.merge().raw ?? '',
                        invert: flags.I !== undefined,
                        confirm: flags.y !== undefined
                    })
                }
            ]
        });

        this.middleware.push(new SingleThreadMiddleware(ctx => ctx.channel.id));
    }

    public async tidy(context: GuildCommandContext, count: number, options: TidyOptions): Promise<CommandResult> {
        if (count <= 0)
            return cmd.default.notNegative({ count });

        count = Math.min(count, 500);

        const filter = await buildFilter(context, options);
        switch (filter) {
            case 'INVALID_REGEX': return templates.regex.invalid;
            case 'INVALID_USER': return cmd.default.invalidUsers;
        }

        const messages: Eris.KnownMessage[] = [];
        let searched = 0;
        let nextTyping = await checkTyping(context.channel, moment());
        for await (const message of fetchMessages(context)) {
            searched++;
            if (filter(message))
                messages.push(message);

            if (messages.length >= count || searched >= count * 5)
                break;

            nextTyping = await checkTyping(context.channel, nextTyping);
        }

        const confirmed = options.confirm || await context.queryConfirm({
            prompt: messages.length < count
                ? cmd.default.confirmQuery.prompt.foundSome({ total: messages.length, searched, breakdown: buildBreakdown(messages) })
                : cmd.default.confirmQuery.prompt.foundAll({ total: messages.length, breakdown: buildBreakdown(messages) }),
            cancel: cmd.default.confirmQuery.cancel,
            continue: cmd.default.confirmQuery.continue,
            fallback: false
        });

        if (!confirmed)
            return cmd.default.cancelled;

        messages.push(context.message);

        // TODO remove the context message from the list of command messages
        const result = await deleteMessages(context, nextTyping, messages);

        const commandDeleted = result.success.delete(context.message);

        if (result.success.size === 0)
            return cmd.default.deleteFailed;

        const resultMessage = result.failed.size === 0
            ? cmd.default.success.default({ deleted: result.success.size, success: buildBreakdown(result.success) })
            : cmd.default.success.partial({ deleted: result.success.size, success: buildBreakdown(result.success), failed: buildBreakdown(result.failed) });

        if (!commandDeleted)
            return resultMessage;

        const toDelete = await context.reply(resultMessage);
        setTimeout(() => void toDelete?.delete(), 10000);
        return undefined;
    }

}

interface TidyOptions {
    botsOnly: boolean;
    invites: boolean;
    links: boolean;
    embeds: boolean;
    attachments: boolean;
    users: string[] | undefined;
    query: string;
    invert: boolean;
    confirm: boolean;
}

interface DeleteResult {
    success: Set<Eris.KnownMessage>;
    failed: Set<Eris.KnownMessage>;
    nextTyping: moment.Moment;
}

async function buildFilter(context: GuildCommandContext, options: TidyOptions): Promise<'INVALID_REGEX' | 'INVALID_USER' | ((message: Eris.KnownMessage) => boolean)> {
    const conditions: Array<(message: Eris.KnownMessage) => boolean> = [];

    if (options.attachments)
        conditions.push(m => m.attachments.length > 0);
    if (options.botsOnly)
        conditions.push(m => m.author.bot);
    if (options.embeds)
        conditions.push(m => m.embeds.length > 0);
    if (options.invites)
        conditions.push(m => invite.test(m.content));
    if (options.links)
        conditions.push(m => /https?:\/\/.+?\../.test(m.content));
    if (options.query !== '') {
        const result = createSafeRegExp(options.query);
        if (!result.success)
            return 'INVALID_REGEX';
        conditions.push(m => result.value.test(m.content));
    }
    if (options.users !== undefined) {
        const users = new Set<string>();
        for (const user of new Set(options.users)) {
            const match = await context.queryUser({ filter: user });
            if (match.state !== 'SUCCESS')
                return 'INVALID_USER';
            users.add(match.value.id);
        }
        conditions.push(m => users.has(m.author.id));
    }

    return m => !conditions.some(c => c(m) === options.invert);

}

async function* fetchMessages(context: GuildCommandContext): AsyncGenerator<Eris.KnownMessage> {
    let lastId: string | undefined = context.message.id;
    let messages: Eris.KnownMessage[];
    do {
        await context.channel.sendTyping();
        messages = await context.channel.getMessages({ before: lastId, limit: 100 });
        for (const message of messages.values())
            yield message;
        lastId = messages[messages.length - 1].id;
    } while (messages.length === 100);
}
function buildBreakdown(messages: Iterable<Eris.KnownMessage>): Array<{ user: Eris.User; count: number; }> {
    const grouped = {} as Record<string, { user: Eris.User; count: number; }>;
    for (const message of messages) {
        grouped[message.author.id] ??= { user: message.author, count: 0 };
        grouped[message.author.id].count++;
    }

    return Object.values(grouped)
        .sort((a, b) => b.count - a.count)
        .map(({ user, count }) => ({ user, count }));
}

async function checkTyping(channel: Eris.KnownTextableChannel, nextTyping: moment.Moment): Promise<moment.Moment> {
    if (!nextTyping.isSameOrBefore(moment()))
        return nextTyping;

    await channel.sendTyping();
    return moment().add(5, 's');
}

async function deleteMessages(context: GuildCommandContext, nextTyping: moment.Moment, messages: Eris.KnownMessage[]): Promise<DeleteResult> {
    const remaining = new Set(messages);
    const result: DeleteResult = { success: new Set(), failed: new Set(), nextTyping };

    await bulkDelete(context, remaining, result);
    await deleteIndividual(context, remaining, result);

    return result;
}

async function bulkDelete(context: GuildCommandContext, messages: Set<Eris.KnownMessage>, result: DeleteResult): Promise<void> {
    const cutoff = moment().add(-2, 'weeks').add(10, 'minutes');
    const within2Weeks = [...messages].filter(m => cutoff.isBefore(m.createdAt));
    while (within2Weeks.length > 0) {
        result.nextTyping = await checkTyping(context.channel, result.nextTyping);
        try {
            const toDelete = [...new Set(within2Weeks.splice(0, 100))];
            await context.channel.deleteMessages(toDelete.map(m => m.id));
            toDelete.forEach(message => {
                result.success.add(message);
                messages.delete(message);
            });
        } catch (err: unknown) {
            if (err instanceof Eris.DiscordRESTError && err.code === Eris.ApiError.MISSING_PERMISSIONS)
                return;
            throw err;
        }
    }
}

async function deleteIndividual(context: GuildCommandContext, messages: Set<Eris.KnownMessage>, result: DeleteResult): Promise<void> {
    const promises = [];
    let state: 'discover' | 'noperms' | 'deleteall' = 'discover';
    for (const message of messages) {
        if (message.author.id === context.discord.user.id)
            promises.push(deleteIndividualSafe(context, message, result));
        else switch (state) {
            case 'noperms':
                result.failed.add(message);
                break;
            case 'deleteall':
                promises.push(deleteIndividualSafe(context, message, result));
                break;
            case 'discover': switch (await deleteIndividualSafe(context, message, result)) {
                case 'NO_PERMS':
                    state = 'noperms';
                    break;
                case 'FAILED':
                    break;
                case 'SUCCESS':
                    state = 'deleteall';
                    break;
            }
        }
    }
    await Promise.all(promises);
}

async function deleteIndividualSafe(context: GuildCommandContext, message: Eris.KnownMessage, result: DeleteResult): Promise<'SUCCESS' | 'NO_PERMS' | 'FAILED'> {
    try {
        await message.delete();
        result.success.add(message);
        return 'SUCCESS';
    } catch (err: unknown) {
        if (err instanceof Eris.DiscordRESTError) {
            switch (err.code) {
                case Eris.ApiError.UNKNOWN_MESSAGE:
                    result.success.add(message);
                    return 'FAILED';
                case Eris.ApiError.MISSING_PERMISSIONS:
                    result.failed.add(message);
                    return 'NO_PERMS';
                default:
                    result.failed.add(message);
                    context.logger.error('TidyCommand failed to delete message', message.id, err);
                    return 'FAILED';
            }
        }
        throw err;
    } finally {
        result.nextTyping = await checkTyping(context.channel, result.nextTyping);
    }
}
