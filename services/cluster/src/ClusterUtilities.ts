import { randomUUID } from 'node:crypto';

import { defaultStaff, parse } from '@blargbot/cluster/utils/index.js';
import { BaseUtilities } from '@blargbot/core/BaseUtilities.js';
import { FormattableMessageContent } from '@blargbot/core/FormattableMessageContent.js';
import type { ChoiceQuery, ChoiceQueryOptions, ChoiceQueryResult, ConfirmQuery, ConfirmQueryOptions, EntityFindQueryOptions, EntityPickQueryOptions, EntityQueryOptions, FormatSelectMenuOptions, MultipleQuery, MultipleQueryOptions, MultipleQueryResult, QueryButton, SendContent, TextQuery, TextQueryOptions, TextQueryOptionsParsed, TextQueryResult } from '@blargbot/core/types.js';
import { findRolePosition, isCategoryChannel, isGuildChannel, isPrivateChannel, isVoiceChannel } from '@blargbot/discord-util';
import type { IFormattable } from '@blargbot/formatting';
import { format, util } from '@blargbot/formatting';
import { hasValue } from '@blargbot/guards';
import * as Eris from 'eris';
import fetch from 'node-fetch';

import type { Cluster } from './Cluster.js';
import type { Awaiter } from './managers/index.js';
import templates from './text.js';

export class ClusterUtilities extends BaseUtilities {
    public constructor(
        public readonly cluster: Cluster
    ) {
        super(cluster);
    }

    public async queryChoice<T>(options: ChoiceQueryOptions<IFormattable<string>, T>): Promise<ChoiceQueryResult<T>> {
        const query = await this.createChoiceQuery(options);
        const result = await query.getResult();
        try {
            await query.prompt?.delete();
        } catch { /* NOOP */ }
        return result;
    }

    public async createChoiceQuery<T>(options: ChoiceQueryOptions<IFormattable<string>, T>): Promise<ChoiceQuery<T>> {
        const valueMap: Record<string, T> = {};
        const selectData: Array<FormatSelectMenuOptions<IFormattable<string>>> = [];
        const pageSize = 25;

        for (const option of options.choices) {
            const id = randomUUID();
            valueMap[id] = option.value;
            selectData.push({ ...option, value: id });
        }

        if (selectData.length === 0) {
            return {
                prompt: undefined,
                getResult: () => Promise.resolve({ state: 'NO_OPTIONS' }),
                cancel() { /* NOOP */ }
            };
        }

        if (selectData.length === 1) {
            return {
                prompt: undefined,
                getResult: () => Promise.resolve({ state: 'SUCCESS', value: Object.values(valueMap)[0] }),
                cancel() { /* NOOP */ }
            };
        }

        const content = options.prompt === undefined ? undefined
            : util.isFormattable(options.prompt) ? options.prompt : options.prompt.content;

        const component: ChoiceComponentOptions<IFormattable<string>> = {
            content,
            get select(): Array<FormatSelectMenuOptions<IFormattable<string>>> {
                return selectData.slice(this.page * pageSize, (this.page + 1) * pageSize);
            },
            page: 0,
            lastPage: Math.floor((selectData.length - 1) / pageSize),
            placeholder: options.placeholder,
            prevId: randomUUID(),
            nextId: randomUUID(),
            cancelId: randomUUID(),
            selectId: randomUUID()
        };

        const channel = options.context;
        const formatter = await this.getFormatter(channel);
        const awaiter = this.createComponentAwaiter(options.actors, templates.common.query.cantUse, options.timeout, {
            [component.cancelId]: () => true,
            [component.selectId]: () => true,
            [component.prevId]: async i => {
                component.page--;
                await i.editParent(createChoiceBody(component)[format](formatter));
                return false;
            },
            [component.nextId]: async i => {
                component.page++;
                await i.editParent(createChoiceBody(component)[format](formatter));
                return false;
            }
        });

        const choice = createChoiceBody(component);
        const payload = new FormattableMessageContent(util.isFormattable(options.prompt) ? { content: options.prompt } : options.prompt ?? {});
        const prompt = await this.#sendOrReply(options.context, util.literal({
            ...payload[format](formatter),
            ...choice[format](formatter)
        }));
        if (prompt === undefined)
            return { prompt: undefined, getResult: () => Promise.resolve({ state: 'FAILED' }), cancel() { /* NOOP */ } };

        return {
            prompt,
            async getResult() {
                const interaction = await awaiter.wait();
                await cleanupQuery(prompt, interaction);
                if (interaction === undefined)
                    return { state: 'TIMED_OUT' };

                if (interaction.data.component_type === Eris.Constants.ComponentTypes.SELECT_MENU)
                    return { state: 'SUCCESS', value: valueMap[interaction.data.values[0]] };

                if (interaction.data.custom_id === component.cancelId)
                    return { state: 'CANCELLED' };

                return { state: 'TIMED_OUT' };
            },
            async cancel() {
                awaiter.cancel();
                await cleanupQuery(prompt);
            }
        };
    }

    public async queryMultiple<T>(options: MultipleQueryOptions<IFormattable<string>, T>): Promise<MultipleQueryResult<T>> {
        const query = await this.createMultipleQuery(options);
        const result = await query.getResult();
        try {
            await query.prompt?.delete();
        } catch { /* NOOP */ }
        return result;
    }

    public async createMultipleQuery<T>(options: MultipleQueryOptions<IFormattable<string>, T>): Promise<MultipleQuery<T>> {
        const valueMap: Record<string, T> = {};
        const selectData: Array<FormatSelectMenuOptions<IFormattable<string>>> = [];

        for (const option of options.choices) {
            const id = randomUUID();
            valueMap[id] = option.value;
            selectData.push({ ...option, value: id });
        }

        if (selectData.length === 0) {
            return {
                prompt: undefined,
                getResult: () => Promise.resolve({ state: 'NO_OPTIONS' }),
                cancel() { /* NOOP */ }
            };
        }

        if (selectData.length > 25) {
            return {
                prompt: undefined,
                getResult: () => Promise.resolve({ state: 'EXCESS_OPTIONS' }),
                cancel() { /* NOOP */ }
            };
        }

        const component: MultipleComponentOptions<IFormattable<string>> = {
            select: selectData,
            placeholder: options.placeholder,
            cancelId: randomUUID(),
            selectId: randomUUID(),
            maxCount: options.maxCount,
            minCount: options.minCount
        };

        const awaiter = this.createComponentAwaiter(options.actors, templates.common.query.cantUse, options.timeout, {
            [component.cancelId]: () => true,
            [component.selectId]: () => true
        });

        const payload = new FormattableMessageContent(util.isFormattable(options.prompt) ? { content: options.prompt } : options.prompt ?? {});
        const prompt = await this.#sendOrReply(options.context, {
            [format](formatter) {
                return {
                    ...payload[format](formatter),
                    ...createMultipleBody(component)[format](formatter)
                };
            }
        });
        if (prompt === undefined)
            return { prompt: undefined, getResult: () => Promise.resolve({ state: 'FAILED' }), cancel() { /* NOOP */ } };

        return {
            prompt,
            async getResult() {
                const interaction = await awaiter.wait();
                await cleanupQuery(prompt, interaction);
                if (interaction === undefined)
                    return { state: 'TIMED_OUT' };

                if (interaction.data.component_type === Eris.Constants.ComponentTypes.SELECT_MENU)
                    return { state: 'SUCCESS', value: interaction.data.values.map(id => valueMap[id]) };

                if (interaction.data.custom_id === component.cancelId)
                    return { state: 'CANCELLED' };

                return { state: 'TIMED_OUT' };
            },
            async cancel() {
                awaiter.cancel();
                await cleanupQuery(prompt);
            }
        };
    }

    public async queryConfirm(options: ConfirmQueryOptions<IFormattable<string>>): Promise<boolean | undefined>
    public async queryConfirm(options: ConfirmQueryOptions<IFormattable<string>, boolean>): Promise<boolean>
    public async queryConfirm(options: ConfirmQueryOptions<IFormattable<string>, boolean | undefined>): Promise<boolean | undefined>
    public async queryConfirm(options: ConfirmQueryOptions<IFormattable<string>, boolean | undefined>): Promise<boolean | undefined> {
        const query = await this.createConfirmQuery(options);
        const result = await query.getResult();
        try {
            await query.prompt?.delete();
        } catch { /* NOOP */ }
        return result;
    }

    public async createConfirmQuery(options: ConfirmQueryOptions<IFormattable<string>>): Promise<ConfirmQuery>;
    public async createConfirmQuery(options: ConfirmQueryOptions<IFormattable<string>, boolean>): Promise<ConfirmQuery<boolean>>
    public async createConfirmQuery(options: ConfirmQueryOptions<IFormattable<string>, boolean | undefined>): Promise<ConfirmQuery<boolean | undefined>>
    public async createConfirmQuery(options: ConfirmQueryOptions<IFormattable<string>, boolean | undefined>): Promise<ConfirmQuery<boolean | undefined>> {
        const component: ConfirmComponentOptions<IFormattable<string>> = {
            cancelId: randomUUID(),
            confirmId: randomUUID(),
            cancelButton: options.cancel,
            confirmButton: options.continue
        };

        const awaiter = this.createComponentAwaiter(options.actors, templates.common.query.cantUse, options.timeout, {
            [component.confirmId]: () => true,
            [component.cancelId]: () => true
        });

        const payload = new FormattableMessageContent(util.isFormattable(options.prompt) ? { content: options.prompt } : options.prompt ?? {});
        const prompt = await this.#sendOrReply(options.context, {
            [format](formatter) {
                return {
                    ...payload[format](formatter),
                    ...createConfirmBody(component)[format](formatter)
                };
            }
        });
        if (prompt === undefined) {
            awaiter.cancel();
            return { prompt, getResult: () => Promise.resolve(options.fallback), cancel() { /* NOOP */ } };
        }

        return {
            prompt,
            async getResult() {
                const interaction = await awaiter.wait();
                await cleanupQuery(prompt, interaction);
                switch (interaction?.data.custom_id) {
                    case component.confirmId: return true;
                    case undefined: return options.fallback;
                    default: return false;
                }
            },
            async cancel() {
                awaiter.cancel();
                await cleanupQuery(prompt);
            }
        };
    }

    public async queryText<T>(options: TextQueryOptionsParsed<IFormattable<string>, T>): Promise<TextQueryResult<T>>
    public async queryText(options: TextQueryOptions<IFormattable<string>>): Promise<TextQueryResult<string>>
    public async queryText<T>(options: TextQueryOptionsParsed<IFormattable<string>, T> | TextQueryOptions<IFormattable<string>>): Promise<TextQueryResult<T | string>>
    public async queryText<T>(options: TextQueryOptionsParsed<IFormattable<string>, T> | TextQueryOptions<IFormattable<string>>): Promise<TextQueryResult<T | string>> {
        const query = await this.createTextQuery(options);
        return await query.getResult();
    }

    public async createTextQuery<T>(options: TextQueryOptionsParsed<IFormattable<string>, T>): Promise<TextQuery<T>>
    public async createTextQuery(options: TextQueryOptions<IFormattable<string>>): Promise<TextQuery<string>>
    public async createTextQuery<T>(options: TextQueryOptionsParsed<IFormattable<string>, T> | TextQueryOptions<IFormattable<string>>): Promise<TextQuery<T | string>>
    public async createTextQuery<T>(options: TextQueryOptionsParsed<IFormattable<string>, T> | TextQueryOptions<IFormattable<string>>): Promise<TextQuery<T | string>> {
        const component: TextComponentOptions<IFormattable<string>> = {
            cancelId: randomUUID(),
            cancelButton: options.cancel ?? templates.common.query.cancel
        };

        let parsed: { success: true; value: T | string; } | { success: false; } | undefined;
        const messages: Array<Eris.Message<Eris.Textable & Eris.Channel>> = [];
        const parse = options.parse ?? (m => ({ success: true, value: m.content }));
        const channel = options.context;
        const componentAwaiter = this.createComponentAwaiter(options.actors, templates.common.query.cantUse, options.timeout, { [component.cancelId]: () => true });
        const messageAwaiter = this.createMessageAwaiter(channel, options.actors, options.timeout, async message => {
            const parseResult = await parse(message);
            if (!parseResult.success && parseResult.error !== undefined) {
                messages.push(message);
                const prompt = await this.reply(message, new FormattableMessageContent(parseResult.error));
                if (prompt !== undefined)
                    messages.push(prompt);
            }

            if (parseResult.success)
                parsed = parseResult;

            return parseResult.success;
        });

        const payload = new FormattableMessageContent(util.isFormattable(options.prompt) ? { content: options.prompt } : options.prompt ?? {});
        const prompt = await this.#sendOrReply(options.context, {
            [format](formatter) {
                return {
                    ...payload[format](formatter),
                    ...createTextBody(component)[format](formatter)
                };
            }
        });
        if (prompt === undefined) {
            return {
                messages: messages,
                getResult() { return Promise.resolve({ state: 'FAILED', related: messages }); },
                cancel() { /* NOOP */ }
            };
        }

        messages.push(prompt);

        return {
            messages: messages,
            async getResult() {
                const result = await Promise.race([componentAwaiter.wait(), messageAwaiter.wait()]);
                componentAwaiter.cancel();
                messageAwaiter.cancel();
                await cleanupQuery(prompt, result);
                if (result === undefined)
                    return { state: 'TIMED_OUT' };

                if ('data' in result)
                    return { state: 'CANCELLED' };

                messages.push(result);
                if (parsed?.success === true)
                    return { state: 'SUCCESS', value: parsed.value };
                return { state: 'CANCELLED' };
            },
            async cancel() {
                componentAwaiter.cancel();
                messageAwaiter.cancel();
                await cleanupQuery(prompt);
            }
        };
    }

    async #sendOrReply<T extends Eris.Textable & Eris.Channel>(context: T | Eris.Message<T>, content: IFormattable<SendContent<string>>, author?: Eris.User): Promise<Eris.Message<T> | undefined> {
        return context instanceof Eris.Message
            ? await this.reply(context, content, author)
            : await this.send(context, content, author);
    }

    public createComponentAwaiter(
        actors: Iterable<string | Eris.User> | string | Eris.User,
        rejectMessage: IFormattable<string>,
        timeout: number | undefined,
        options: Record<string, (interaction: Eris.ComponentInteraction) => boolean | Promise<boolean>>
    ): Awaiter<Eris.ComponentInteraction> {
        const actorFilter = createActorFilter(actors);
        const validIds = new Set(Object.keys(options));
        const reject = new FormattableMessageContent({ content: rejectMessage, flags: Eris.Constants.MessageFlags.EPHEMERAL });
        return this.cluster.awaiter.components.getAwaiter(validIds, async (interaction) => {
            if (!actorFilter(interaction.member?.user ?? interaction.user)) {
                const formatter = await this.getFormatter(interaction.channel);
                await interaction.createMessage(reject[format](formatter));
                return false;
            }

            return await options[interaction.data.custom_id](interaction);
        }, timeout ?? 60000);
    }

    public createMessageAwaiter<T extends Eris.Textable & Eris.Channel>(
        channel: T,
        actors: Iterable<string | Eris.User> | string | Eris.User,
        timeout: number | undefined,
        filter: (message: Eris.Message<T>) => Promise<boolean> | boolean
    ): Awaiter<Eris.Message<T>> {
        const actorFilter = createActorFilter(actors);
        return this.cluster.awaiter.messages.getAwaiter([channel], async message => {
            return actorFilter(message.author) && await filter(message);
        }, timeout ?? 60000);
    }

    public async queryUser(options: EntityFindQueryOptions<IFormattable<string>>): Promise<ChoiceQueryResult<Eris.User>>
    public async queryUser(options: EntityPickQueryOptions<IFormattable<string>, Eris.User>): Promise<ChoiceQueryResult<Eris.User>>
    public async queryUser(options: EntityQueryOptions<IFormattable<string>, Eris.User>): Promise<ChoiceQueryResult<Eris.User>> {
        const matches = 'guild' in options ? await this.findUsers(options.guild, options.filter) : [...options.choices];

        return await this.queryChoice({
            ...options,
            prompt: options.prompt ?? (options.filter === undefined
                ? templates.common.query.user.prompt.default
                : templates.common.query.user.prompt.filtered({ filter: options.filter })),
            placeholder: options.placeholder ?? templates.common.query.user.placeholder,
            choices: matches
                .map(u => ({ u, sortKey: `${u.username}#${u.discriminator}` }))
                .sort((a, b) => a.sortKey > b.sortKey ? 1 : -1)
                .map(({ u }) => ({
                    label: templates.common.query.user.choice.label({ user: u }),
                    emoji: { name: u.bot ? '🤖' : '👤' },
                    value: u,
                    description: templates.common.query.user.choice.description({ user: u })
                }))
        });
    }

    public async querySender(options: EntityPickQueryOptions<IFormattable<string>, Eris.User | Eris.Webhook>): Promise<ChoiceQueryResult<Eris.User | Eris.Webhook>> {
        return await this.queryChoice({
            ...options,
            prompt: options.prompt ?? (options.filter === undefined
                ? templates.common.query.sender.prompt.default
                : templates.common.query.sender.prompt.filtered({ filter: options.filter })),
            placeholder: options.placeholder ?? templates.common.query.sender.placeholder,
            choices: [...options.choices]
                .map(u => ({ u, sortKey: u instanceof Eris.User ? `${u.username}#${u.discriminator}` : u.name }))
                .sort((a, b) => a.sortKey > b.sortKey ? 1 : -1)
                .map(({ u }) => ({
                    label: u instanceof Eris.User
                        ? templates.common.query.sender.choice.label.user({ user: u })
                        : templates.common.query.sender.choice.label.webhook({ webhook: u }),
                    emoji: { name: u instanceof Eris.User ? u.bot ? '🤖' : '👤' : '🪝' },
                    value: u,
                    description: templates.common.query.sender.choice.description({ sender: u })
                }))
        });
    }

    public async queryMember(options: EntityFindQueryOptions<IFormattable<string>>): Promise<ChoiceQueryResult<Eris.Member>>
    public async queryMember(options: EntityPickQueryOptions<IFormattable<string>, Eris.Member>): Promise<ChoiceQueryResult<Eris.Member>>
    public async queryMember(options: EntityQueryOptions<IFormattable<string>, Eris.Member>): Promise<ChoiceQueryResult<Eris.Member>> {
        const matches = 'guild' in options ? await this.findMembers(options.guild, options.filter) : [...options.choices];

        return await this.queryChoice({
            ...options,
            prompt: options.prompt ?? (options.filter === undefined
                ? templates.common.query.member.prompt.default
                : templates.common.query.member.prompt.filtered({ filter: options.filter })),
            placeholder: options.placeholder ?? templates.common.query.member.placeholder,
            choices: matches
                .map(m => ({ m, sortKey: `${m.nick ?? m.username} (${m.username}#${m.discriminator})` }))
                .sort((a, b) => a.sortKey > b.sortKey ? 1 : -1)
                .map(({ m }) => ({
                    label: templates.common.query.member.choice.label({ member: m }),
                    emoji: { name: m.user.bot ? '🤖' : '👤' },
                    value: m,
                    description: templates.common.query.member.choice.description({ member: m })
                }))
        });
    }

    public async queryRole(options: EntityFindQueryOptions<IFormattable<string>>): Promise<ChoiceQueryResult<Eris.Role>>
    public async queryRole(options: EntityPickQueryOptions<IFormattable<string>, Eris.Role>): Promise<ChoiceQueryResult<Eris.Role>>
    public async queryRole(options: EntityQueryOptions<IFormattable<string>, Eris.Role>): Promise<ChoiceQueryResult<Eris.Role>> {
        const matches = 'guild' in options ? await this.findRoles(options.guild, options.filter) : [...options.choices];

        return await this.queryChoice({
            ...options,
            prompt: options.prompt ?? (options.filter === undefined
                ? templates.common.query.role.prompt.default
                : templates.common.query.role.prompt.filtered({ filter: options.filter })),
            placeholder: options.placeholder ?? templates.common.query.role.placeholder,
            choices: matches
                .map(r => ({ r, sortKey: r.name }))
                .sort((a, b) => a.sortKey > b.sortKey ? 1 : -1)
                .map(({ r }) => ({
                    label: templates.common.query.role.choice.label({ role: r }),
                    value: r,
                    description: templates.common.query.role.choice.description({ role: r })
                }))
        });
    }

    public async queryChannel(options: EntityFindQueryOptions<IFormattable<string>>): Promise<ChoiceQueryResult<Eris.KnownGuildChannel>>;
    public async queryChannel<T extends Eris.KnownChannel>(options: EntityPickQueryOptions<IFormattable<string>, T>): Promise<ChoiceQueryResult<T>>;
    public async queryChannel(options: EntityQueryOptions<IFormattable<string>, Eris.KnownChannel>): Promise<ChoiceQueryResult<Eris.KnownChannel>> {
        const matches = 'guild' in options ? await this.findChannels(options.guild, options.filter) : [...options.choices];

        return await this.queryChoice({
            ...options,
            prompt: options.prompt ?? (options.filter === undefined
                ? templates.common.query.channel.prompt.default
                : templates.common.query.channel.prompt.filtered({ filter: options.filter })),
            placeholder: options.placeholder ?? templates.common.query.channel.placeholder,
            choices: sortChannels(matches)
                .map(c => ({
                    x: {
                        id: c.id,
                        value: c,
                        details: getChannelLookupSelect(c),
                        parent: isGuildChannel(c) && c.parentID !== null ? c.guild.channels.get(c.parentID) : undefined
                    },
                    sortKey: 'name' in c ? c.name : c.id
                }))
                .sort((a, b) => a.sortKey > b.sortKey ? 1 : -1)
                .map(({ x }) => ({
                    ...x.details,
                    emoji: { name: x.details.emoji },
                    description: templates.common.query.channel.choice.description({
                        channel: x.value,
                        parent: x.parent === undefined ? undefined : getChannelLookupSelect(x.parent)
                    }),
                    value: x.value
                }))
        });
    }

    public async displayPaged(
        channel: Eris.KnownTextableChannel,
        user: Eris.User,
        getPage: (page: number) => Promise<{
            content: IFormattable<string>;
            pageCount: number;
            header: IFormattable<string>;
        } | undefined>
    ): Promise<boolean | undefined> {
        let page = 0;
        while (!isNaN(page)) {
            const content = await getPage(page);
            if (content === undefined)
                return false;
            const pageQuery = await this.createTextQuery<number>({
                context: channel,
                actors: user,
                prompt: templates.common.query.paged.prompt({ ...content, page }),
                parse: message => {
                    const pageNumber = parse.int(message.content, { strict: true });
                    if (pageNumber === undefined)
                        return { success: false };
                    return { success: true, value: pageNumber - 1 };
                }
            });

            const response = await pageQuery.getResult();
            await Promise.allSettled(pageQuery.messages.map(m => m.delete()));
            if (response.state !== 'SUCCESS')
                return undefined;

            page = response.value;
        }
        return true;
    }

    /* eslint-disable @typescript-eslint/naming-convention */
    public async postStats(): Promise<void> {
        const stats = {
            server_count: this.discord.guilds.size,
            shard_count: this.discord.shards.size,
            shard_id: this.cluster.id
        };
        this.logger.log(stats);

        const promises = [];
        if (this.config.general.botlisttoken.length > 0) {
            promises.push(
                fetch(`https://discord.bots.gg/api/v1/bots/${this.user.id}/stats`, {
                    method: 'POST',
                    headers: {
                        'content-type': 'application/json',
                        'Authorization': this.config.general.botlisttoken,
                        'User-Agent': 'blargbot/1.0 (ratismal)'
                    },
                    body: JSON.stringify(stats)
                })
            );
        }

        if (this.config.general.carbontoken.length > 0) {
            promises.push(
                fetch('https://www.carbonitex.net/discord/data/botdata.php', {
                    method: 'POST',
                    headers: {
                        'content-type': 'application/json'
                    },
                    body: JSON.stringify({
                        'key': this.config.general.carbontoken,
                        'servercount': stats.server_count,
                        shard_count: stats.shard_count,
                        shard_id: stats.shard_id,
                        'logoid': this.user.avatar
                    })
                })
            );
        }

        if (this.config.general.botlistorgtoken.length > 0) {
            const shards = [];
            for (const shard of this.discord.shards.values()) {
                shards[shard.id] = this.discord.guilds.filter(g => g.shard.id === shard.id);
            }
            promises.push(
                fetch(`https://discordbots.org/api/bots/${this.user.id}/stats`, {
                    method: 'POST',
                    headers: {
                        'content-type': 'application/json',
                        'Authorization': this.config.general.botlistorgtoken,
                        'User-Agent': 'blargbot/1.0 (ratismal)'
                    },
                    body: JSON.stringify(shards)
                })
            );
        }

        if (promises.length > 0)
            this.logger.info('Posting to matt');

        for (const promise of promises) {
            try {
                await promise;
            } catch (err: unknown) {
                this.logger.error(err);
            }
        }
    }
    /* eslint-enable @typescript-eslint/naming-convention */

    public isBotHigher(member: Eris.Member): boolean {
        const bot = member.guild.members.get(this.discord.user.id);
        if (bot === undefined)
            return false;

        const botPosition = findRolePosition(bot.roles, bot.guild.roles.values());
        const memberPosition = findRolePosition(member.roles, member.guild.roles.values());
        return botPosition > memberPosition;
    }

    public async isUserStaff(member: Eris.Member): Promise<boolean>;
    public async isUserStaff(userId: string, guildId: string | Eris.Guild): Promise<boolean>;
    public async isUserStaff(guildId: string | Eris.Guild): Promise<(member: Eris.Member) => boolean>;
    public async isUserStaff(
        ...args:
            | [userId: string, guildId: string | Eris.Guild]
            | [member: Eris.Member]
            | [guildId: string | Eris.Guild]
    ): Promise<boolean | ((member: Eris.Member) => boolean)> {
        let member;
        if (args.length === 2) {
            if (args[0] === args[1])
                return true;
            member = await this.getMember(args[1], args[0]);
        } else if (args[0] instanceof Eris.Member) {
            member = args[0];
        } else {
            const guildId = typeof args[0] === 'string' ? args[0] : args[0].id;

            const allow = parse.bigInt(await this.database.guilds.getSetting(guildId, 'staffperms') ?? defaultStaff);
            if (allow !== undefined)
                return m => m.guild.id === guildId && (m.id === m.guild.ownerID || m.permissions.has('administrator') || this.hasPerms(m, allow));

            return m => m.guild.id === guildId && (m.id === m.guild.ownerID || m.permissions.has('administrator'));
        }

        if (member === undefined) return false;

        if (member.guild.ownerID === member.id) return true;
        if (member.permissions.has('administrator')) return true;

        const allow = parse.bigInt(await this.database.guilds.getSetting(member.guild.id, 'staffperms') ?? defaultStaff);
        return allow !== undefined && this.hasPerms(member, allow);
    }

    public hasPerms(member: Eris.Member, allow: bigint): boolean {
        if (allow === 0n)
            return true;

        allow |= Eris.Constants.Permissions.administrator;
        return (allow & member.permissions.allow) !== 0n;
    }

    public isBotStaff(id: string): boolean {
        return this.isBotDeveloper(id) || this.cluster.botStaff.staff.has(id);
    }

    public isBotSupport(id: string): boolean {
        return this.isBotStaff(id) || this.cluster.botStaff.support.has(id);
    }
}

interface ChoiceComponentOptions<TString> {
    readonly content: TString | undefined;
    readonly selectId: string;
    readonly cancelId: string;
    readonly prevId: string;
    readonly nextId: string;
    readonly lastPage: number;
    readonly placeholder: TString | undefined;
    readonly select: ReadonlyArray<FormatSelectMenuOptions<TString>>;
    page: number;
}

interface MultipleComponentOptions<TString> {
    readonly selectId: string;
    readonly cancelId: string;
    readonly placeholder: TString | undefined;
    readonly select: ReadonlyArray<FormatSelectMenuOptions<TString>>;
    readonly maxCount?: number;
    readonly minCount?: number;
}

interface ConfirmComponentOptions<TString> {
    readonly confirmId: string;
    readonly cancelId: string;
    readonly confirmButton: QueryButton<TString>;
    readonly cancelButton: QueryButton<TString>;
}

interface TextComponentOptions<TString> {
    readonly cancelId: string;
    readonly cancelButton: QueryButton<TString>;
}

function createActorFilter(actors: Iterable<string | Eris.User | Eris.Member> | string | Eris.User | Eris.Member): (user?: Eris.User) => boolean {
    const userIds = new Set<string>();
    if (typeof actors === 'string')
        userIds.add(actors);
    else {
        if ('id' in actors)
            actors = [actors];
        for (const actor of actors)
            userIds.add(typeof actor === 'string' ? actor : actor.id);
    }

    switch (userIds.size) {
        case 0: return () => false;
        case 1: {
            const check = [...userIds][0];
            return user => user?.id === check;
        }
        default:
            return user => userIds.has(user?.id);
    }
}

function createConfirmBody(options: ConfirmComponentOptions<IFormattable<string>>): IFormattable<Pick<Eris.AdvancedMessageContent, 'components'>> {
    const confirm = {
        style: Eris.Constants.ButtonStyles.SUCCESS,
        ...util.isFormattable(options.confirmButton) ? { label: options.confirmButton } : options.confirmButton,
        type: Eris.Constants.ComponentTypes.BUTTON,
        custom_id: options.confirmId
    };

    const cancel = {
        style: Eris.Constants.ButtonStyles.DANGER,
        ...util.isFormattable(options.cancelButton) ? { label: options.cancelButton } : options.cancelButton,
        type: Eris.Constants.ComponentTypes.BUTTON,
        custom_id: options.cancelId
    };

    return new FormattableMessageContent({
        components: [
            {
                type: Eris.Constants.ComponentTypes.ACTION_ROW,
                components: [confirm, cancel]
            }
        ]
    });
}

function createMultipleBody(options: MultipleComponentOptions<IFormattable<string>>): IFormattable<Pick<Eris.AdvancedMessageContent, 'components'>> {
    const select = {
        type: Eris.Constants.ComponentTypes.SELECT_MENU,
        custom_id: options.selectId,
        options: [...options.select],
        placeholder: options.placeholder,
        max_values: options.maxCount ?? options.select.length,
        min_values: options.minCount ?? 0
    };
    const cancel = {
        type: Eris.Constants.ComponentTypes.BUTTON,
        custom_id: options.cancelId,
        emoji: { name: '✖️' },
        style: Eris.Constants.ButtonStyles.DANGER
    };

    return new FormattableMessageContent({
        components: [
            { type: Eris.Constants.ComponentTypes.ACTION_ROW, components: [select] },
            { type: Eris.Constants.ComponentTypes.ACTION_ROW, components: [cancel] }
        ]
    });
}

function createChoiceBody(options: ChoiceComponentOptions<IFormattable<string>>): IFormattable<Pick<Eris.AdvancedMessageContent, 'components' | 'content'>> {
    const select = {
        type: Eris.Constants.ComponentTypes.SELECT_MENU,
        custom_id: options.selectId,
        options: [...options.select],
        placeholder: options.placeholder
    };
    const cancel = {
        type: Eris.Constants.ComponentTypes.BUTTON,
        custom_id: options.cancelId,
        emoji: { name: '✖️' },
        style: Eris.Constants.ButtonStyles.DANGER
    };

    if (options.lastPage === 0) {
        return new FormattableMessageContent({
            content: options.content,
            components: [
                { type: Eris.Constants.ComponentTypes.ACTION_ROW, components: [select] },
                { type: Eris.Constants.ComponentTypes.ACTION_ROW, components: [cancel] }
            ]
        });
    }

    const prev = {
        type: Eris.Constants.ComponentTypes.BUTTON,
        custom_id: options.prevId,
        emoji: { name: '⬅' },
        style: Eris.Constants.ButtonStyles.PRIMARY,
        disabled: options.page === 0
    };

    const next = {
        type: Eris.Constants.ComponentTypes.BUTTON,
        custom_id: options.nextId,
        emoji: { name: '➡' },
        style: Eris.Constants.ButtonStyles.PRIMARY,
        disabled: options.page === options.lastPage
    };

    return new FormattableMessageContent({
        content: templates.common.query.choose.paged({ content: options.content, page: options.page, pageCount: options.lastPage }),
        components: [
            { type: Eris.Constants.ComponentTypes.ACTION_ROW, components: [select] },
            { type: Eris.Constants.ComponentTypes.ACTION_ROW, components: [prev, cancel, next] }
        ]
    });
}

function createTextBody(options: TextComponentOptions<IFormattable<string>>, disabled = false): IFormattable<Pick<Eris.AdvancedMessageContent, 'components'>> {
    return new FormattableMessageContent({
        components: [
            {
                type: Eris.Constants.ComponentTypes.ACTION_ROW,
                components: [{
                    style: Eris.Constants.ButtonStyles.SECONDARY,
                    ...util.isFormattable(options.cancelButton) ? { label: options.cancelButton } : options.cancelButton,
                    type: Eris.Constants.ComponentTypes.BUTTON,
                    custom_id: options.cancelId,
                    disabled: disabled
                }]
            }
        ]
    });
}

function getChannelLookupSelect(channel: Eris.KnownChannel): { label: IFormattable<string>; emoji: string; } {
    switch (channel.type) {
        case Eris.Constants.ChannelTypes.DM: return { emoji: '🕵️', label: templates.common.query.channel.choice.label.dm };
        case Eris.Constants.ChannelTypes.GROUP_DM: return { emoji: '👥', label: templates.common.query.channel.choice.label.dm };
        case Eris.Constants.ChannelTypes.GUILD_CATEGORY: return { emoji: '📁', label: templates.common.query.channel.choice.label.guild({ channel }) };
        case Eris.Constants.ChannelTypes.GUILD_NEWS: return { emoji: '📰', label: templates.common.query.channel.choice.label.guild({ channel }) };
        case Eris.Constants.ChannelTypes.GUILD_NEWS_THREAD: return { emoji: '✏️', label: templates.common.query.channel.choice.label.guild({ channel }) };
        case Eris.Constants.ChannelTypes.GUILD_PRIVATE_THREAD: return { emoji: '✏️', label: templates.common.query.channel.choice.label.guild({ channel }) };
        case Eris.Constants.ChannelTypes.GUILD_PUBLIC_THREAD: return { emoji: '✏️', label: templates.common.query.channel.choice.label.guild({ channel }) };
        case Eris.Constants.ChannelTypes.GUILD_STAGE_VOICE: return { emoji: '🔈', label: templates.common.query.channel.choice.label.guild({ channel }) };
        case Eris.Constants.ChannelTypes.GUILD_STORE: return { emoji: '🛒', label: templates.common.query.channel.choice.label.guild({ channel }) };
        case Eris.Constants.ChannelTypes.GUILD_TEXT: return { emoji: '✏️', label: templates.common.query.channel.choice.label.guild({ channel }) };
        case Eris.Constants.ChannelTypes.GUILD_VOICE: return { emoji: '🔈', label: templates.common.query.channel.choice.label.guild({ channel }) };
    }
}

async function cleanupQuery(...items: Array<Eris.Message<Eris.Textable & Eris.Channel> | Eris.ComponentInteraction | undefined>): Promise<void> {
    const promises = [];
    for (const item of items) {
        if (item instanceof Eris.ComponentInteraction)
            promises.push(item.editOriginalMessage({ components: disableComponents(item.message.components ?? []) }));
        else if (item?.components !== undefined && item.components.length > 0)
            promises.push(item.edit({ components: disableComponents(item.components) }));
    }

    await Promise.allSettled(promises);
}

function disableComponents(components: Iterable<Eris.ActionRow>): Eris.ActionRow[] {
    return [...disableComponentsCore(components)];
}

function disableComponentsCore<T extends Eris.ActionRow | Eris.Button | Eris.SelectMenu>(components: Iterable<T>): Iterable<T>;
function disableComponentsCore(components: Iterable<Eris.ActionRow | Eris.Button | Eris.SelectMenu>): Iterable<Eris.ActionRow | Eris.Button | Eris.SelectMenu>;
function* disableComponentsCore(components: Iterable<Eris.ActionRow | Eris.Button | Eris.SelectMenu>): Iterable<Eris.ActionRow | Eris.Button | Eris.SelectMenu> {
    for (const component of components) {
        switch (component.type) {
            case Eris.Constants.ComponentTypes.ACTION_ROW:
                yield {
                    type: Eris.Constants.ComponentTypes.ACTION_ROW,
                    components: [...disableComponentsCore(component.components)]
                };
                break;
            case Eris.Constants.ComponentTypes.BUTTON:
                yield {
                    ...component,
                    disabled: true
                };
                break;
            case Eris.Constants.ComponentTypes.SELECT_MENU:
                yield {
                    ...component,
                    disabled: true
                };
                break;
        }
    }
}

function sortChannels<T extends Eris.KnownChannel>(channels: Iterable<T>): T[] {
    const nonGuild = [];
    const nonGroup = [];
    const groups = {} as Record<string, { parent: Eris.KnownCategoryChannel; includeParent: boolean; children: Array<T & Eris.GuildChannel>; } | undefined>;

    for (const channel of channels) {
        if (isPrivateChannel(channel)) {
            nonGuild.push(channel);
            continue;
        }

        if (!isGuildChannel(channel))
            continue;

        if (hasValue(channel.parentID)) {
            const parent = channel.guild.channels.get(channel.parentID);
            if (parent === undefined || !isCategoryChannel(parent)) {
                nonGroup.push(channel);
            } else {
                const group = groups[channel.parentID] ??= { parent, includeParent: false, children: [] };
                group.children.push(channel);
            }
        } else if (isCategoryChannel(channel)) {
            const group = groups[channel.id] ??= { parent: channel, includeParent: true, children: [] };
            group.includeParent = true;
        } else {
            nonGroup.push(channel);
        }
    }

    return [
        ...nonGuild.sort((a, b) => a.recipient.username > b.recipient.username ? 1 : -1),
        ...nonGroup.sort(compareGuildChannels),
        ...Object.values(groups)
            .filter(hasValue)
            .sort((a, b) => a.parent.position - b.parent.position)
            .flatMap(g => {
                const result = g.children.sort(compareGuildChannels);
                if (g.includeParent)
                    result.unshift(g.parent as never);
                return result;
            })
    ];
}

function compareGuildChannels(left: Eris.GuildChannel, right: Eris.GuildChannel): number {
    return isVoiceChannel(left) ? isVoiceChannel(right)
        ? left.position - right.position
        : 1
        : isVoiceChannel(right)
            ? -1
            : left.position - right.position;
}
