import { codeBlock, defaultStaff, discord, guard, humanize, parse, snowflake } from '@blargbot/cluster/utils';
import { BaseUtilities } from '@blargbot/core/BaseUtilities';
import { ChoiceQuery, ChoiceQueryOptions, ChoiceQueryResult as ChoiceResult, ConfirmQuery, ConfirmQueryOptions, EntityFindQueryOptions, EntityPickQueryOptions, EntityQueryOptions, MultipleQuery, MultipleQueryOptions, MultipleResult, QueryButton, TextQuery, TextQueryOptions, TextQueryOptionsParsed, TextQueryResult } from '@blargbot/core/types';
import { ActionRow, AdvancedMessageContent, Button, ComponentInteraction, Constants, Guild, InteractionButton, KnownCategoryChannel, KnownChannel, KnownGuildChannel, KnownMessage, KnownPrivateChannel, KnownTextableChannel, Member, Message, Role, SelectMenu, SelectMenuOptions, User, Webhook } from 'eris';
import fetch from 'node-fetch';

import { Cluster } from './Cluster';
import { Awaiter } from './managers';

export class ClusterUtilities extends BaseUtilities {
    public constructor(
        public readonly cluster: Cluster
    ) {
        super(cluster);
    }

    public async queryChoice<T>(options: ChoiceQueryOptions<T>): Promise<ChoiceResult<T>> {
        const query = await this.createChoiceQuery(options);
        const result = await query.getResult();
        try {
            await query.prompt?.delete();
        } catch { /* NOOP */ }
        return result;
    }

    public async createChoiceQuery<T>(options: ChoiceQueryOptions<T>): Promise<ChoiceQuery<T>> {
        const valueMap: Record<string, T> = {};
        const selectData: SelectMenuOptions[] = [];
        const pageSize = 25;

        for (const option of options.choices) {
            const id = snowflake.create().toString();
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

        if (typeof options.prompt === 'string')
            options.prompt = { content: options.prompt };

        const component: ChoiceComponentOptions = {
            content: options.prompt?.content ?? '',
            get select(): SelectMenuOptions[] {
                return selectData.slice(this.page * pageSize, (this.page + 1) * pageSize);
            },
            page: 0,
            lastPage: Math.floor(selectData.length / pageSize),
            placeholder: options.placeholder,
            prevId: snowflake.create().toString(),
            nextId: snowflake.create().toString(),
            cancelId: snowflake.create().toString(),
            selectId: snowflake.create().toString()
        };

        const awaiter = this.createComponentAwaiter(options.actors, '❌ This isnt for you to use!', options.timeout, {
            [component.cancelId]: () => true,
            [component.selectId]: () => true,
            [component.prevId]: async i => {
                component.page--;
                await i.editParent(createChoiceBody(component));
                return false;
            },
            [component.nextId]: async i => {
                component.page++;
                await i.editParent(createChoiceBody(component));
                return false;
            }
        });

        const prompt = await this.send(options.context, { ...options.prompt, ...createChoiceBody(component) });
        if (prompt === undefined)
            return { prompt: undefined, getResult: () => Promise.resolve({ state: 'FAILED' }), cancel() { /* NOOP */ } };

        return {
            prompt,
            async getResult() {
                const interaction = await awaiter.wait();
                await cleanupQuery(prompt, interaction);
                if (interaction === undefined)
                    return { state: 'TIMED_OUT' };

                if (interaction.data.component_type === Constants.ComponentTypes.SELECT_MENU)
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

    public async queryMultiple<T>(options: MultipleQueryOptions<T>): Promise<MultipleResult<T>> {
        const query = await this.createMultipleQuery(options);
        const result = await query.getResult();
        try {
            await query.prompt?.delete();
        } catch { /* NOOP */ }
        return result;
    }

    public async createMultipleQuery<T>(options: MultipleQueryOptions<T>): Promise<MultipleQuery<T>> {
        const valueMap: Record<string, T> = {};
        const selectData: SelectMenuOptions[] = [];

        for (const option of options.choices) {
            const id = snowflake.create().toString();
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

        if (typeof options.prompt === 'string')
            options.prompt = { content: options.prompt };

        const component: MultipleComponentOptions = {
            select: selectData,
            placeholder: options.placeholder,
            cancelId: snowflake.create().toString(),
            selectId: snowflake.create().toString(),
            maxCount: options.maxCount,
            minCount: options.minCount
        };

        const awaiter = this.createComponentAwaiter(options.actors, '❌ This isnt for you to use!', options.timeout, {
            [component.cancelId]: () => true,
            [component.selectId]: () => true
        });

        const prompt = await this.send(options.context, { ...options.prompt, ...createMultipleBody(component) });
        if (prompt === undefined)
            return { prompt: undefined, getResult: () => Promise.resolve({ state: 'FAILED' }), cancel() { /* NOOP */ } };

        return {
            prompt,
            async getResult() {
                const interaction = await awaiter.wait();
                await cleanupQuery(prompt, interaction);
                if (interaction === undefined)
                    return { state: 'TIMED_OUT' };

                if (interaction.data.component_type === Constants.ComponentTypes.SELECT_MENU)
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

    public async queryConfirm(options: ConfirmQueryOptions): Promise<boolean | undefined>
    public async queryConfirm(options: ConfirmQueryOptions<boolean>): Promise<boolean>
    public async queryConfirm(options: ConfirmQueryOptions<boolean | undefined>): Promise<boolean | undefined>
    public async queryConfirm(options: ConfirmQueryOptions<boolean | undefined>): Promise<boolean | undefined> {
        const query = await this.createConfirmQuery(options);
        const result = await query.getResult();
        try {
            await query.prompt?.delete();
        } catch { /* NOOP */ }
        return result;
    }

    public async createConfirmQuery(options: ConfirmQueryOptions): Promise<ConfirmQuery>;
    public async createConfirmQuery(options: ConfirmQueryOptions<boolean>): Promise<ConfirmQuery<boolean>>
    public async createConfirmQuery(options: ConfirmQueryOptions<boolean | undefined>): Promise<ConfirmQuery<boolean | undefined>>
    public async createConfirmQuery(options: ConfirmQueryOptions<boolean | undefined>): Promise<ConfirmQuery<boolean | undefined>> {
        const payload = typeof options.prompt === 'string' ? { content: options.prompt } : options.prompt;

        const component: ConfirmComponentOptions = {
            cancelId: snowflake.create().toString(),
            confirmId: snowflake.create().toString(),
            cancelButton: options.cancel,
            confirmButton: options.confirm
        };

        const awaiter = this.createComponentAwaiter(options.actors, '❌ This isnt for you to use!', options.timeout, {
            [component.confirmId]: () => true,
            [component.cancelId]: () => true
        });

        const prompt = await this.send(options.context, { ...payload, ...createConfirmBody(component) });
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

    public async queryText<T>(options: TextQueryOptionsParsed<T>): Promise<TextQueryResult<T>>
    public async queryText(options: TextQueryOptions): Promise<TextQueryResult<string>>
    public async queryText<T>(options: TextQueryOptionsParsed<T> | TextQueryOptions): Promise<TextQueryResult<T | string>>
    public async queryText<T>(options: TextQueryOptionsParsed<T> | TextQueryOptions): Promise<TextQueryResult<T | string>> {
        const query = await this.createTextQuery(options);
        return await query.getResult();
    }

    public async createTextQuery<T>(options: TextQueryOptionsParsed<T>): Promise<TextQuery<T>>
    public async createTextQuery(options: TextQueryOptions): Promise<TextQuery<string>>
    public async createTextQuery<T>(options: TextQueryOptionsParsed<T> | TextQueryOptions): Promise<TextQuery<T | string>>
    public async createTextQuery<T>(options: TextQueryOptionsParsed<T> | TextQueryOptions): Promise<TextQuery<T | string>> {
        const payload = typeof options.prompt === 'string' ? { content: options.prompt } : options.prompt;
        const component: TextComponentOptions = {
            cancelId: snowflake.create().toString(),
            cancelButton: options.cancel ?? 'Cancel'
        };

        let parsed: { success: true; value: T | string; } | { success: false; } | undefined;
        const messages: KnownMessage[] = [];
        const parse = options.parse ?? (m => ({ success: true, value: m.content }));
        const channel = options.context instanceof Message ? options.context.channel : options.context;
        const componentAwaiter = this.createComponentAwaiter(options.actors, '❌ This isnt for you to use!', options.timeout, { [component.cancelId]: () => true });
        const messageAwaiter = this.createMessageAwaiter(channel, options.actors, options.timeout, async message => {
            const parseResult = await parse(message);
            if (!parseResult.success && parseResult.error !== undefined) {
                messages.push(message);
                const prompt = await this.send(message, parseResult.error);
                if (prompt !== undefined)
                    messages.push(prompt);
            }

            if (parseResult.success)
                parsed = parseResult;

            return parseResult.success;
        });

        const prompt = await this.send(options.context, { ...payload, ...createTextBody(component) });
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

    public createComponentAwaiter(
        actors: Iterable<string | User> | string | User,
        rejectMessage: string,
        timeout: number | undefined,
        options: Record<string, (interaction: ComponentInteraction) => boolean | Promise<boolean>>
    ): Awaiter<ComponentInteraction> {
        const actorFilter = createActorFilter(actors);
        const validIds = new Set(Object.keys(options));
        return this.cluster.awaiter.components.getAwaiter(validIds, async (interaction) => {
            if (!actorFilter(interaction.member?.user ?? interaction.user)) {
                await interaction.createMessage({ content: rejectMessage, flags: Constants.MessageFlags.EPHEMERAL });
                return false;
            }

            return await options[interaction.data.custom_id](interaction);
        }, timeout ?? 60000);
    }

    public createMessageAwaiter<T extends KnownTextableChannel = KnownTextableChannel>(
        channel: T,
        actors: Iterable<string | User> | string | User,
        timeout: number | undefined,
        filter: (message: Message<T>) => Promise<boolean> | boolean
    ): Awaiter<Message<T>> {
        const actorFilter = createActorFilter(actors);
        return this.cluster.awaiter.messages.getAwaiter([channel], async message => {
            return actorFilter(message.author) && await filter(message);
        }, timeout ?? 60000);
    }

    public async queryUser(options: EntityPickQueryOptions<User>): Promise<ChoiceResult<User>> {
        return await this.queryChoice({
            ...options,
            prompt: options.prompt ?? (options.filter === undefined
                ? 'ℹ️ Please select a user from the drop down'
                : `ℹ️ Multiple users matching \`${options.filter}\` found! Please select one from the drop down.`),
            placeholder: options.placeholder ?? 'Select a user',
            choices: [...options.choices].map(u => ({
                label: humanize.fullName(u),
                emoji: { name: u.bot ? '🤖' : '👤' },
                value: u,
                description: `Id: ${u.id}`
            })).sort((a, b) => a.label > b.label ? 1 : -1)
        });
    }

    public async querySender(options: EntityPickQueryOptions<User | Webhook>): Promise<ChoiceResult<User | Webhook>> {
        return await this.queryChoice({
            ...options,
            prompt: options.prompt ?? (options.filter === undefined
                ? 'ℹ️ Please select a user or webhook from the drop down'
                : `ℹ️ Multiple users matching \`${options.filter}\` found! Please select one from the drop down.`),
            placeholder: options.placeholder ?? 'Select a user',
            choices: [...options.choices].map(u => ({
                label: u instanceof User ? humanize.fullName(u) : u.name,
                emoji: { name: u instanceof User ? u.bot ? '🤖' : '👤' : '🪝' },
                value: u,
                description: `Id: ${u.id}`
            })).sort((a, b) => a.label > b.label ? 1 : -1)
        });
    }

    public async queryMember(options: EntityFindQueryOptions): Promise<ChoiceResult<Member>>
    public async queryMember(options: EntityPickQueryOptions<Member>): Promise<ChoiceResult<Member>>
    public async queryMember(options: EntityQueryOptions<Member>): Promise<ChoiceResult<Member>> {
        const matches = 'guild' in options ? await this.findMembers(options.guild, options.filter) : [...options.choices];

        return await this.queryChoice({
            ...options,
            prompt: options.prompt ?? (options.filter === undefined
                ? 'ℹ️ Please select a user from the drop down'
                : `ℹ️ Multiple users matching \`${options.filter}\` found! Please select one from the drop down.`),
            placeholder: options.placeholder ?? 'Select a user',
            choices: matches.map(m => ({
                label: `${m.nick ?? m.username} (${humanize.fullName(m.user)})`,
                emoji: { name: m.user.bot ? '🤖' : '👤' },
                value: m,
                description: `Id: ${m.id}`
            })).sort((a, b) => a.label > b.label ? 1 : -1)
        });
    }

    public async queryRole(options: EntityFindQueryOptions): Promise<ChoiceResult<Role>>
    public async queryRole(options: EntityPickQueryOptions<Role>): Promise<ChoiceResult<Role>>
    public async queryRole(options: EntityQueryOptions<Role>): Promise<ChoiceResult<Role>> {
        const matches = 'guild' in options ? await this.findRoles(options.guild, options.filter) : [...options.choices];

        return await this.queryChoice({
            ...options,
            prompt: options.prompt ?? (options.filter === undefined
                ? 'ℹ️ Please select a role from the drop down'
                : `ℹ️ Multiple roles matching \`${options.filter}\` found! Please select one from the drop down.`),
            placeholder: options.placeholder ?? 'Select a role',
            choices: matches
                .map(r => ({
                    label: r.name,
                    value: r,
                    description: `Id: ${r.id} Color: #${r.color.toString(16).padStart(6, '0')}`
                })).sort((a, b) => a.label > b.label ? 1 : -1)
        });
    }

    public async queryChannel(options: EntityFindQueryOptions): Promise<ChoiceResult<KnownGuildChannel>>;
    public async queryChannel<T extends KnownChannel>(options: EntityPickQueryOptions<T>): Promise<ChoiceResult<T>>;
    public async queryChannel(options: EntityQueryOptions<KnownChannel>): Promise<ChoiceResult<KnownChannel>> {
        const matches = 'guild' in options ? await this.findChannels(options.guild, options.filter) : [...options.choices];

        return await this.queryChoice({
            ...options,
            prompt: options.prompt ?? (options.filter === undefined
                ? 'ℹ️ Please select a channel from the drop down'
                : `ℹ️ Multiple channels matching \`${options.filter}\` found! Please select one from the drop down.`),
            placeholder: options.placeholder ?? 'Select a channel',
            choices: sortChannels(matches)
                .map(c => ({
                    id: c.id,
                    value: c,
                    details: getChannelLookupSelect(c),
                    parent: guard.isGuildChannel(c) && c.parentID !== null ? c.guild.channels.get(c.parentID) : undefined
                }))
                .map(x => ({
                    ...x.details,
                    emoji: { name: x.details.emoji },
                    description: `Id: ${x.id}${x.parent !== undefined ? ` Parent: ${getChannelLookupName(x.parent)}` : ''}`,
                    value: x.value
                }))
        });
    }

    public async displayPaged(
        channel: KnownTextableChannel,
        user: User,
        filterText: string,
        getItems: (skip: number, take: number) => Promise<readonly string[]>,
        itemCount: () => Promise<number>,
        pageSize = 20,
        separator = '\n'
    ): Promise<boolean | undefined> {
        let page = 0;
        while (!isNaN(page)) {
            const items = await getItems(page * pageSize, pageSize);
            if (items.length === 0)
                return false;
            const total = await itemCount();
            const pageCount = Math.ceil(total / pageSize);
            const pageQuery = await this.createTextQuery<number>({
                context: channel,
                actors: user,
                prompt: `Found ${items.length}/${total}${filterText}.\n` +
                    `Page **#${page + 1}/${pageCount}**\n` +
                    `${codeBlock(items.join(separator), 'fix')}\n` +
                    `Type a number between **1 and ${pageCount}** to view that page.`,
                parse: message => {
                    const pageNumber = parse.int(message.content) + 1;
                    if (isNaN(pageNumber))
                        return { success: false };
                    return { success: true, value: pageNumber };
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

    public isBotHigher(member: Member): boolean {
        const bot = member.guild.members.get(this.discord.user.id);
        if (bot === undefined)
            return false;

        return discord.getMemberPosition(bot) > discord.getMemberPosition(member);
    }

    public async isUserStaff(member: Member): Promise<boolean>;
    public async isUserStaff(userId: string, guildId: string | Guild): Promise<boolean>;
    public async isUserStaff(guildId: string | Guild): Promise<(member: Member) => boolean>;
    public async isUserStaff(
        ...args:
            | [userId: string, guildId: string | Guild]
            | [member: Member]
            | [guildId: string | Guild]
    ): Promise<boolean | ((member: Member) => boolean)> {
        let member;
        if (args.length === 2) {
            if (args[0] === args[1]) return true;
            member = await this.getMember(args[1], args[0]);
        } else if (args[0] instanceof Member) {
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

    public hasPerms(member: Member, allow: bigint): boolean {
        if (allow === 0n)
            return true;

        allow |= Constants.Permissions.administrator;
        return (allow & member.permissions.allow) !== 0n;
    }

    public isBotStaff(id: string): boolean {
        return this.isBotDeveloper(id) || this.cluster.botStaff.staff.has(id);
    }

    public isBotSupport(id: string): boolean {
        return this.isBotStaff(id) || this.cluster.botStaff.support.has(id);
    }
}

interface ChoiceComponentOptions {
    readonly content: string;
    readonly selectId: string;
    readonly cancelId: string;
    readonly prevId: string;
    readonly nextId: string;
    readonly lastPage: number;
    readonly placeholder: string | undefined;
    readonly select: SelectMenuOptions[];
    page: number;
}

interface MultipleComponentOptions {
    readonly selectId: string;
    readonly cancelId: string;
    readonly placeholder: string | undefined;
    readonly select: SelectMenuOptions[];
    readonly maxCount?: number;
    readonly minCount?: number;
}

interface ConfirmComponentOptions {
    readonly confirmId: string;
    readonly cancelId: string;
    readonly confirmButton: QueryButton;
    readonly cancelButton: QueryButton;
}

interface TextComponentOptions {
    readonly cancelId: string;
    readonly cancelButton: QueryButton;
}

function createActorFilter(actors: Iterable<string | User | Member> | string | User | Member): (user?: User) => boolean {
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

function createConfirmBody(options: ConfirmComponentOptions): Pick<AdvancedMessageContent, 'components'> {
    const confirm: InteractionButton = {
        style: Constants.ButtonStyles.SUCCESS,
        ...typeof options.confirmButton === 'string' ? { label: options.confirmButton } : options.confirmButton,
        type: Constants.ComponentTypes.BUTTON,
        custom_id: options.confirmId
    };

    const cancel: InteractionButton = {
        style: Constants.ButtonStyles.DANGER,
        ...typeof options.cancelButton === 'string' ? { label: options.cancelButton } : options.cancelButton,
        type: Constants.ComponentTypes.BUTTON,
        custom_id: options.cancelId
    };

    return {
        components: [
            {
                type: Constants.ComponentTypes.ACTION_ROW,
                components: [confirm, cancel]
            }
        ]
    };
}

function createMultipleBody(options: MultipleComponentOptions): Pick<AdvancedMessageContent, 'components'> {
    const select: SelectMenu = {
        type: Constants.ComponentTypes.SELECT_MENU,
        custom_id: options.selectId,
        options: options.select,
        placeholder: options.placeholder,
        max_values: options.maxCount ?? options.select.length,
        min_values: options.minCount ?? 0
    };
    const cancel: InteractionButton = {
        type: Constants.ComponentTypes.BUTTON,
        custom_id: options.cancelId,
        emoji: { name: '✖️' },
        style: Constants.ButtonStyles.DANGER
    };

    return {
        components: [
            { type: Constants.ComponentTypes.ACTION_ROW, components: [select] },
            { type: Constants.ComponentTypes.ACTION_ROW, components: [cancel] }
        ]
    };
}

function createChoiceBody(options: ChoiceComponentOptions): Pick<AdvancedMessageContent, 'components' | 'content'> {
    const select: SelectMenu = {
        type: Constants.ComponentTypes.SELECT_MENU,
        custom_id: options.selectId,
        options: options.select,
        placeholder: options.placeholder
    };
    const cancel: InteractionButton = {
        type: Constants.ComponentTypes.BUTTON,
        custom_id: options.cancelId,
        emoji: { name: '✖️' },
        style: Constants.ButtonStyles.DANGER
    };

    if (options.lastPage === 0) {
        return {
            content: options.content,
            components: [
                { type: Constants.ComponentTypes.ACTION_ROW, components: [select] },
                { type: Constants.ComponentTypes.ACTION_ROW, components: [cancel] }
            ]
        };
    }

    const prev: InteractionButton = {
        type: Constants.ComponentTypes.BUTTON,
        custom_id: options.prevId,
        emoji: { name: 'bigarrowleft', id: '876227640976097351' }, // TODO config
        style: Constants.ButtonStyles.PRIMARY,
        disabled: options.page === 0
    };

    const next: InteractionButton = {
        type: Constants.ComponentTypes.BUTTON,
        custom_id: options.nextId,
        emoji: { name: 'bigarrowright', id: '876227816998461511' }, // TODO config
        style: Constants.ButtonStyles.PRIMARY,
        disabled: options.page === options.lastPage
    };

    return {
        content: `${options.content}\nPage ${options.page + 1}/${options.lastPage + 1}`.trim(),
        components: [
            { type: Constants.ComponentTypes.ACTION_ROW, components: [select] },
            { type: Constants.ComponentTypes.ACTION_ROW, components: [prev, cancel, next] }
        ]
    };
}

function createTextBody(options: TextComponentOptions, disabled = false): Pick<AdvancedMessageContent, 'components'> {

    return {
        components: [
            {
                type: Constants.ComponentTypes.ACTION_ROW,
                components: [{
                    style: Constants.ButtonStyles.SECONDARY,
                    ...typeof options.cancelButton === 'string' ? { label: options.cancelButton } : options.cancelButton,
                    type: Constants.ComponentTypes.BUTTON,
                    custom_id: options.cancelId,
                    disabled: disabled
                }]
            }
        ]
    };
}

function getChannelLookupName(channel: KnownChannel): string {
    const opt = getChannelLookupSelect(channel);
    return `${opt.emoji} ${opt.label}`;
}

function getChannelLookupSelect(channel: KnownChannel): { label: string; emoji: string; } {
    switch (channel.type) {
        case Constants.ChannelTypes.DM: return { emoji: '🕵️', label: 'DM' };
        case Constants.ChannelTypes.GROUP_DM: return { emoji: '👥', label: 'Group DM' };
        case Constants.ChannelTypes.GUILD_CATEGORY: return { emoji: '📁', label: channel.name };
        case Constants.ChannelTypes.GUILD_NEWS: return { emoji: '📰', label: channel.name };
        case Constants.ChannelTypes.GUILD_NEWS_THREAD: return { emoji: '✏️', label: channel.name };
        case Constants.ChannelTypes.GUILD_PRIVATE_THREAD: return { emoji: '✏️', label: channel.name };
        case Constants.ChannelTypes.GUILD_PUBLIC_THREAD: return { emoji: '✏️', label: channel.name };
        case Constants.ChannelTypes.GUILD_STAGE_VOICE: return { emoji: '🔈', label: channel.name };
        case Constants.ChannelTypes.GUILD_STORE: return { emoji: '🛒', label: channel.name };
        case Constants.ChannelTypes.GUILD_TEXT: return { emoji: '✏️', label: channel.name };
        case Constants.ChannelTypes.GUILD_VOICE: return { emoji: '🔈', label: channel.name };
    }
}

async function cleanupQuery(...items: Array<KnownMessage | ComponentInteraction | undefined>): Promise<void> {
    const promises = [];
    for (const item of items) {
        if (item instanceof ComponentInteraction)
            promises.push(item.editOriginalMessage({ components: disableComponents(item.message.components ?? []) }));
        else if (item?.components !== undefined && item.components.length > 0)
            promises.push(item.edit({ components: disableComponents(item.components) }));
    }

    await Promise.allSettled(promises);
}

function disableComponents(components: Iterable<ActionRow>): ActionRow[] {
    return [...disableComponentsCore(components)];
}

function disableComponentsCore<T extends ActionRow | Button | SelectMenu>(components: Iterable<T>): Iterable<T>;
function disableComponentsCore(components: Iterable<ActionRow | Button | SelectMenu>): Iterable<ActionRow | Button | SelectMenu>;
function* disableComponentsCore(components: Iterable<ActionRow | Button | SelectMenu>): Iterable<ActionRow | Button | SelectMenu> {
    for (const component of components) {
        switch (component.type) {
            case Constants.ComponentTypes.ACTION_ROW:
                yield {
                    type: Constants.ComponentTypes.ACTION_ROW,
                    components: [...disableComponentsCore(component.components)]
                };
                break;
            case Constants.ComponentTypes.BUTTON:
                yield {
                    ...component,
                    disabled: true
                };
                break;
            case Constants.ComponentTypes.SELECT_MENU:
                yield {
                    ...component,
                    disabled: true
                };
                break;
        }
    }
}

function sortChannels<T extends KnownChannel>(channels: Iterable<T>): T[] {
    const channelGroups = {
        nonGuild: [] as Array<T & KnownPrivateChannel>,
        nonGroup: [] as Array<T & KnownGuildChannel>,
        groups: {} as Record<string, { parent: KnownCategoryChannel; includeParent: boolean; children: Array<T & KnownGuildChannel>; } | undefined>
    };

    for (const channel of channels) {
        if (guard.isPrivateChannel(channel)) {
            channelGroups.nonGuild.push(channel);
            continue;
        }

        if (!guard.isGuildChannel(channel))
            continue;

        if (guard.hasValue(channel.parentID)) {
            const parent = channel.guild.channels.get(channel.parentID);
            if (parent === undefined || !guard.isCategoryChannel(parent)) {
                channelGroups.nonGroup.push(channel);
            } else {
                const group = channelGroups.groups[channel.parentID] ??= { parent, includeParent: false, children: [] };
                group.children.push(channel);
            }
        } else if (guard.isCategoryChannel(channel)) {
            const group = channelGroups.groups[channel.id] ??= { parent: channel, includeParent: true, children: [] };
            group.includeParent = true;
        } else {
            channelGroups.nonGroup.push(channel);
        }
    }

    return [
        ...channelGroups.nonGuild.sort((a, b) => a.recipient.username > b.recipient.username ? 1 : -1),
        ...channelGroups.nonGroup.sort(compareGuildChannels),
        ...Object.values(channelGroups.groups)
            .filter(guard.hasValue)
            .sort((a, b) => a.parent.position - b.parent.position)
            .flatMap(g => {
                const result = g.children.sort(compareGuildChannels) as T[];
                if (g.includeParent)
                    result.unshift(g.parent as T);
                return result;
            })
    ];
}

function compareGuildChannels(left: KnownGuildChannel, right: KnownGuildChannel): number {
    return guard.isVoiceChannel(left) ? guard.isVoiceChannel(right)
        ? left.position - right.position
        : 1
        : guard.isVoiceChannel(right)
            ? -1
            : left.position - right.position;
}
