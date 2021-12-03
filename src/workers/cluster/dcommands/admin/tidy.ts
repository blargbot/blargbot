import { BaseGuildCommand, SingleThreadMiddleware } from '@cluster/command';
import { GuildCommandContext } from '@cluster/types';
import { CommandType } from '@cluster/utils';
import { createSafeRegExp, guard, pluralise as p } from '@core/utils';
import { Snowflake } from 'catflake';
import { Collection, Constants, DiscordAPIError, Message, TextBasedChannels, User } from 'discord.js';
import moment from 'moment';
import { Moment } from 'moment-timezone';

export class TidyCommand extends BaseGuildCommand {
    public constructor() {
        super({
            name: 'tidy',
            category: CommandType.ADMIN,
            definitions: [
                {
                    parameters: '{count:integer=100}',
                    description: 'Clears messages from chat',
                    execute: (ctx, [count], flags) => this.tidy(ctx, count.asInteger, {
                        botsOnly: flags.b !== undefined,
                        invites: flags.i !== undefined,
                        links: flags.l !== undefined,
                        embeds: flags.e !== undefined,
                        attachments: flags.a !== undefined,
                        users: flags.u?.merge().raw.split(',').map(s => s.trim()),
                        query: flags.q?.merge().raw ?? '',
                        invert: flags.I !== undefined
                    })
                }
            ],
            flags: [
                { flag: 'b', word: 'bots', description: 'Remove messages from bots.' },
                { flag: 'i', word: 'invites', description: 'Remove messages containing invites.' },
                { flag: 'l', word: 'links', description: 'Remove messages containing links.' },
                { flag: 'e', word: 'embeds', description: 'Remove messages containing embeds.' },
                { flag: 'a', word: 'attachments', description: 'Remove messages containing attachments.' },
                { flag: 'u', word: 'user', description: 'Removes messages from the users specified. Separate users by commas' },
                { flag: 'q', word: 'query', description: 'Removes messages that match the provided query as a regex.' },
                { flag: 'I', word: 'invert', description: 'Reverses the effects of all the flag filters.' }
            ]
        });

        this.middleware.push(new SingleThreadMiddleware(ctx => ctx.channel.id));
    }

    public async tidy(context: GuildCommandContext, count: number, options: TidyOptions): Promise<string | undefined> {
        if (count <= 0)
            return this.error(`I cannot delete ${count} messages!`);

        count = Math.min(count, 500);

        const filter = await buildFilter(context, options);
        switch (filter) {
            case 'INVALID_REGEX': return this.error('That regex is not safe!');
            case 'INVALID_USER': return this.error('I couldnt find some of the users you gave!');
        }

        const messages: Message[] = [];
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

        const queryText = messages.length < count
            ? `${messages.length} ${p(messages.length, 'message')} after searching through ${searched} ${p(searched, 'message')}`
            : `${messages.length} ${p(messages.length, 'message')}`;

        const confirmed = await context.util.queryConfirm({
            context: context.message,
            actors: context.author,
            prompt: this.info(`I am about to attempt to delete ${queryText}. Are you sure you wish to continue?\n${buildSummary(messages)}`),
            cancel: 'Cancel',
            confirm: 'Continue',
            fallback: false
        });

        if (!confirmed)
            return this.success('Tidy cancelled, No messages will be deleted');

        messages.push(context.message);

        // TODO remove the context message from the list of command messages
        const result = await deleteMessages(context, nextTyping, messages);

        const commandDeleted = result.success.delete(context.message);

        if (result.success.size === 0)
            return this.error('I wasnt able to delete any of the messages! Please make sure I have permission to manage messages');

        const resultMessage = result.failed.size === 0
            ? this.success(`Deleted ${result.success.size} ${p(result.success.size, 'message')}:\n${buildSummary(result.success)}`)
            : this.warning(`I managed to delete ${result.success.size} of the messages I attempted to delete.\n` +
                `${buildSummary(result.success)}\n\n` +
                'Failed:\n' +
                `${buildSummary(result.failed)}`);

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
}

interface DeleteResult {
    success: Set<Message>;
    failed: Set<Message>;
    nextTyping: Moment;
}

async function buildFilter(context: GuildCommandContext, options: TidyOptions): Promise<'INVALID_REGEX' | 'INVALID_USER' | ((message: Message) => boolean)> {
    const conditions: Array<(message: Message) => boolean> = [];

    if (options.attachments)
        conditions.push(m => m.attachments.size > 0);
    if (options.botsOnly)
        conditions.push(m => m.author.bot);
    if (options.embeds)
        conditions.push(m => m.embeds.length > 0);
    if (options.invites)
        conditions.push(m => guard.hasInvite(m.content));
    if (options.links)
        conditions.push(m => /https?:\/\/.+?\../.test(m.content));
    if (options.query !== '') {
        const result = createSafeRegExp(options.query);
        if (result.state !== 'success')
            return 'INVALID_REGEX';
        conditions.push(m => result.regex.test(m.content));
    }
    if (options.users !== undefined) {
        const users = new Set<string>();
        for (const user of new Set(options.users)) {
            const match = await context.queryMember({ filter: user });
            if (match.state !== 'SUCCESS')
                return 'INVALID_USER';
            users.add(match.value.id);
        }
        conditions.push(m => users.has(m.author.id));
    }

    return m => !conditions.some(c => c(m) === options.invert);

}

async function* fetchMessages(context: GuildCommandContext): AsyncGenerator<Message> {
    let lastId: string | undefined = context.message.id;
    let messages: Collection<Snowflake, Message>;
    do {
        await context.channel.sendTyping();
        messages = await context.channel.messages.fetch({ before: lastId, limit: 100 }, { cache: false, force: true });
        for (const message of messages.values())
            yield message;
        lastId = messages.last()?.id;
    } while (messages.size > 0);
}

function buildSummary(messages: Iterable<Message>): string {
    const grouped = {} as Record<string, { user: User; count: number; }>;
    for (const message of messages) {
        grouped[message.author.id] ??= { user: message.author, count: 0 };
        grouped[message.author.id].count++;
    }

    return Object.values(grouped)
        .sort((a, b) => b.count - a.count)
        .map(({ user, count }) => `${user.toString()} - ${count} ${p(count, 'message')}`)
        .join('\n');
}

async function checkTyping(channel: TextBasedChannels, nextTyping: Moment): Promise<Moment> {
    if (!nextTyping.isSameOrBefore(moment()))
        return nextTyping;

    await channel.sendTyping();
    return moment().add(5, 's');
}

async function deleteMessages(context: GuildCommandContext, nextTyping: Moment, messages: Message[]): Promise<DeleteResult> {
    const remaining = new Set(messages);
    const result: DeleteResult = { success: new Set(), failed: new Set(), nextTyping };

    await bulkDelete(context, remaining, result);
    await deleteIndividual(context, remaining, result);

    return result;
}

async function bulkDelete(context: GuildCommandContext, messages: Set<Message>, result: DeleteResult): Promise<void> {
    const cutoff = moment().add(-2, 'weeks').add(10, 'minutes');
    const within2Weeks = [...messages].filter(m => cutoff.isBefore(m.createdTimestamp));
    while (within2Weeks.length > 0) {
        result.nextTyping = await checkTyping(context.channel, result.nextTyping);
        try {
            const toDelete = [...new Set(within2Weeks.splice(0, 100))];
            await context.channel.bulkDelete(toDelete.map(m => m.id));
            toDelete.forEach(message => {
                result.success.add(message);
                messages.delete(message);
            });
        } catch (err: unknown) {
            if (err instanceof DiscordAPIError && err.code === Constants.APIErrors.MISSING_PERMISSIONS)
                return;
            throw err;
        }
    }
}

async function deleteIndividual(context: GuildCommandContext, messages: Set<Message>, result: DeleteResult): Promise<void> {
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

async function deleteIndividualSafe(context: GuildCommandContext, message: Message, result: DeleteResult): Promise<'SUCCESS' | 'NO_PERMS' | 'FAILED'> {
    try {
        await message.delete();
        result.success.add(message);
        return 'SUCCESS';
    } catch (err: unknown) {
        if (err instanceof DiscordAPIError) {
            switch (err.code) {
                case Constants.APIErrors.UNKNOWN_MESSAGE:
                    result.success.add(message);
                    return 'FAILED';
                case Constants.APIErrors.MISSING_PERMISSIONS:
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
