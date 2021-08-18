import { MessagePrompt } from '@cluster/types';
import { codeBlock, defaultStaff, guard, humanize, parse, snowflake } from '@cluster/utils';
import { BaseUtilities } from '@core/BaseUtilities';
import { ChoiceQuery, ChoiceQueryOptions, ChoiceQueryResult as ChoiceResult, ConfirmQuery, ConfirmQueryButton, ConfirmQueryOptions, MultipleQuery, MultipleQueryOptions, MultipleResult, SendPayload } from '@core/types';
import { Guild, GuildChannels, GuildMember, KnownChannel, Message, MessageActionRowOptions, MessageButtonOptions, MessageComponentInteraction, MessageSelectMenuOptions, MessageSelectOptionData, Permissions, PermissionString, Role, TextBasedChannels, User } from 'discord.js';
import moment from 'moment';
import fetch from 'node-fetch';

import { Cluster } from './Cluster';

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
        const selectData: MessageSelectOptionData[] = [];
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
            content: options.prompt.content ?? '',
            get select(): MessageSelectOptionData[] {
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

        const channel = options.context instanceof Message ? options.context.channel : options.context;
        const awaiter = this.createComponentAwaiter(channel, options.actors, '❌ This isnt for you to use!', options.timeout, {
            [component.cancelId]: () => true,
            [component.selectId]: () => true,
            [component.prevId]: async i => {
                component.page--;
                await i.update(createChoiceBody(component));
                return false;
            },
            [component.nextId]: async i => {
                component.page++;
                await i.update(createChoiceBody(component));
                return false;
            }
        });

        const prompt = await this.send(options.context, { ...options.prompt, ...createChoiceBody(component) });
        if (prompt === undefined)
            return { prompt: undefined, getResult: () => Promise.resolve({ state: 'FAILED' }), cancel() { /* NOOP */ } };

        return {
            prompt,
            async getResult() {
                const interaction = await awaiter.result;
                await prompt.delete();
                if (interaction === undefined)
                    return { state: 'TIMED_OUT' };

                if (interaction.isSelectMenu())
                    return { state: 'SUCCESS', value: valueMap[interaction.values[0]] };

                if (interaction.customId === component.cancelId)
                    return { state: 'CANCELLED' };

                return { state: 'TIMED_OUT' };
            },
            cancel() {
                awaiter.cancel();
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
        const selectData: MessageSelectOptionData[] = [];

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

        const channel = options.context instanceof Message ? options.context.channel : options.context;
        const awaiter = this.createComponentAwaiter(channel, options.actors, '❌ This isnt for you to use!', options.timeout, {
            [component.cancelId]: () => true,
            [component.selectId]: () => true
        });

        const prompt = await this.send(options.context, { ...options.prompt, ...createMultipleBody(component) });
        if (prompt === undefined)
            return { prompt: undefined, getResult: () => Promise.resolve({ state: 'FAILED' }), cancel() { /* NOOP */ } };

        return {
            prompt,
            async getResult() {
                const interaction = await awaiter.result;
                await prompt.delete();
                if (interaction === undefined)
                    return { state: 'TIMED_OUT' };

                if (interaction.isSelectMenu())
                    return { state: 'SUCCESS', value: interaction.values.map(id => valueMap[id]) };

                if (interaction.customId === component.cancelId)
                    return { state: 'CANCELLED' };

                return { state: 'TIMED_OUT' };
            },
            cancel() {
                awaiter.cancel();
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

        const channel = options.context instanceof Message ? options.context.channel : options.context;
        const awaiter = this.createComponentAwaiter(channel, options.users, '❌ This isnt for you to use!', options.timeout, {
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
                const interaction = await awaiter.result;
                switch (interaction?.customId) {
                    case component.confirmId: return true;
                    case undefined: return options.fallback;
                    default: return false;
                }
            },
            cancel() {
                awaiter.cancel();
            }
        };
    }

    public createComponentAwaiter(
        channel: TextBasedChannels,
        users: Iterable<string | User> | string | User,
        rejectMessage: string,
        timeout: number | undefined,
        options: Record<string, (interaction: MessageComponentInteraction) => boolean | Promise<boolean>>
    ): {
        readonly result: Promise<MessageComponentInteraction | undefined>;
        cancel(): void;
    } {
        const shouldReject = (() => {
            const userIds = typeof users === 'string' ? [users]
                : users instanceof User ? [users.id]
                    : [...users].map(u => typeof u === 'string' ? u : u.id);

            switch (userIds.length) {
                case 0: return () => false;
                case 1: {
                    const check = userIds[0];
                    return (id: string) => id !== check;
                }
                default: {
                    const lookup = new Set(userIds);
                    return (id: string) => !lookup.has(id);
                }
            }
        })();

        const validIds = new Set(Object.keys(options));
        const collector = channel.createMessageComponentCollector({
            time: timeout,
            max: 1,
            filter: async (interaction) => {
                if (!validIds.has(interaction.customId))
                    return false;

                if (shouldReject(interaction.user.id)) {
                    await interaction.reply({ content: rejectMessage, ephemeral: true });
                    return false;
                }

                return await options[interaction.customId](interaction);
            }
        });

        return {
            result: new Promise<MessageComponentInteraction | undefined>(resolve => collector.once('end', c => resolve(c.first()))),
            cancel() {
                collector.stop();
            }
        };
    }
    public async queryUser(
        context: TextBasedChannels | Message,
        actors: Iterable<string | User> | string | User,
        users: Iterable<User>,
        timeout?: number
    ): Promise<ChoiceResult<User>> {
        return await this.queryChoice({
            context,
            actors,
            prompt: 'ℹ️ Multiple users found! Please select one from the drop down.',
            placeholder: 'Select a user',
            timeout,
            choices: [...users].map(u => ({
                label: humanize.fullName(u),
                value: u,
                description: `Id: ${u.id}`
            }))
        });
    }

    public async queryMember(
        context: TextBasedChannels | Message,
        actors: Iterable<string | User> | string | User,
        members: { guild: string | Guild; filter: string; } | Iterable<GuildMember>,
        timeout?: number
    ): Promise<ChoiceResult<GuildMember>> {
        const matches = 'guild' in members ? await this.findMembers(members.guild, members.filter) : [...members];
        return await this.queryChoice({
            context,
            actors,
            prompt: 'ℹ️ Multiple users found! Please select one from the drop down.',
            placeholder: 'Select a user',
            timeout,
            choices: matches.map(m => ({
                label: `${m.displayName} (${humanize.fullName(m.user)})`,
                value: m,
                description: `Id: ${m.id}`
            }))
        });
    }

    public async queryRole(
        context: TextBasedChannels | Message,
        actors: Iterable<string | User> | string | User,
        roles: { guild: string | Guild; filter: string; } | Iterable<Role>,
        timeout?: number
    ): Promise<ChoiceResult<Role>> {
        const matches = 'guild' in roles ? await this.findRoles(roles.guild, roles.filter) : [...roles];
        return await this.queryChoice({
            context,
            actors,
            prompt: 'ℹ️ Multiple roles found! Please select one from the drop down.',
            placeholder: 'Select a role',
            timeout,
            choices: matches.map(r => ({
                label: `${r.name}`,
                value: r,
                description: `Id: ${r.id} Color: #${r.color.toString(16).padStart(6, '0')}`
            }))
        });
    }

    public async queryChannel(
        context: TextBasedChannels | Message,
        actors: Iterable<string | User> | string | User,
        query: { guild: string | Guild; filter: string; },
        timeout?: number
    ): Promise<ChoiceResult<GuildChannels>>;
    public async queryChannel<T extends KnownChannel>(
        context: TextBasedChannels | Message,
        actors: Iterable<string | User> | string | User,
        channels: Iterable<T>,
        timeout?: number
    ): Promise<ChoiceResult<T>>;
    public async queryChannel(
        context: TextBasedChannels | Message,
        actors: Iterable<string | User> | string | User,
        channels: { guild: string | Guild; filter: string; } | Iterable<KnownChannel>,
        timeout?: number
    ): Promise<ChoiceResult<KnownChannel>> {
        const matches = 'guild' in channels ? await this.findChannels(channels.guild, channels.filter) : [...channels];
        return await this.queryChoice({
            context,
            actors,
            prompt: 'ℹ️ Multiple channels found! Please select one from the drop down.',
            placeholder: 'Select a channel',
            timeout,
            choices: matches.map(c => ({
                label: getChannelLookupName(c),
                description: `Id: ${c.id}${guard.isGuildChannel(c) && c.parent !== null ? ` Parent: ${getChannelLookupName(c.parent)}` : ''}`,
                value: c
            }))
        });
    }

    public async displayPaged(
        channel: TextBasedChannels,
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
            const query = await this.createQuery(channel, user,
                `Found ${items.length}/${total}${filterText}.\n` +
                `Page **#${page + 1}/${pageCount}**\n` +
                `${codeBlock(items.join(separator), 'fix')}\n` +
                `Type a number between **1 and ${pageCount}** to view that page, or type \`c\` to cancel.`,
                reply => {
                    page = parse.int(reply.content) - 1;
                    return page >= 0 && page < pageCount
                        || reply.content.toLowerCase() === 'c';
                });

            const response = await query.response;
            try {
                await query.prompt?.delete();
            } catch (err: unknown) {
                this.logger.error(`Failed to delete paging prompt (channel: ${query.prompt?.channel.id ?? 'UNKNOWN'} message: ${query.prompt?.id ?? 'UNKNOWN'}):`, err);
            }
            if (response === undefined)
                return undefined;
        }
        return true;
    }

    public async awaitQuery(
        channel: TextBasedChannels,
        user: User,
        content: SendPayload,
        check?: ((message: Message) => boolean),
        timeoutMS?: number,
        label?: string
    ): Promise<Message | undefined> {
        const query = await this.createQuery(channel, user, content, check, timeoutMS, label);
        return await query.response;
    }

    public async createQuery(
        channel: TextBasedChannels,
        user: User,
        content: SendPayload,
        check?: ((message: Message) => boolean),
        timeoutMS = 300000,
        label?: string
    ): Promise<MessagePrompt> {
        const timeoutMessage = `Query canceled${label !== undefined ? ' in ' + label : ''} after ${moment.duration(timeoutMS).humanize()}.`;
        return this.createPrompt(channel, user, content, check, timeoutMS, timeoutMessage);
    }

    public async awaitPrompt(
        channel: TextBasedChannels,
        user: User,
        content: SendPayload,
        check?: ((message: Message) => boolean),
        timeoutMS?: number,
        timeoutMessage?: SendPayload
    ): Promise<Message | undefined> {
        const prompt = await this.createPrompt(channel, user, content, check, timeoutMS, timeoutMessage);
        return await prompt.response;
    }

    public async createPrompt(
        channel: TextBasedChannels,
        user: User,
        content: SendPayload,
        check: ((message: Message) => boolean) = () => true,
        timeoutMS = 300000,
        timeoutMessage?: SendPayload
    ): Promise<MessagePrompt> {
        const prompt = await this.send(channel, content);
        const response = channel.awaitMessages({
            filter: msg => msg.author.id === user.id && check(msg),
            max: 1,
            time: timeoutMS
        }).then(c => c.first());

        if (timeoutMessage !== undefined) {
            void response.then(async m => {
                if (m === undefined)
                    await this.send(channel, timeoutMessage);
            });
        }

        return {
            prompt,
            response
        };
    }

    /* eslint-disable @typescript-eslint/naming-convention */
    public async postStats(): Promise<void> {

        const stats = {
            server_count: this.discord.guilds.cache.size,
            shard_count: this.discord.ws.shards.size,
            shard_id: this.cluster.id
        };
        this.logger.log(stats);

        if (this.config.general.isbeta)
            return;

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
            for (const shardId of this.discord.ws.shards.keys()) {
                shards[shardId] = this.discord.guilds.cache.filter(g => g.shard.id === shardId);
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

    public hasRole(msg: GuildMember | Message, roles: string | readonly string[], override = true): boolean {
        let member: GuildMember;
        if (msg instanceof GuildMember) {
            member = msg;
        } else {
            if (msg.member === null)
                return false;
            member = msg.member;
        }

        if (override
            && (this.isOwner(member.id)
                || member.guild.ownerId === member.id
                || member.permissions.has('ADMINISTRATOR')))
            return true;

        if (typeof roles === 'string')
            roles = [roles];

        return roles.some(r => member.roles.cache.has(r));
    }

    public isBotHigher(member: GuildMember): boolean {
        const bot = member.guild.me;
        if (bot === null)
            return false;
        const botPos = this.getPosition(bot);
        const memPos = this.getPosition(member);
        return botPos > memPos;
    }

    public getPosition(member: GuildMember): number {
        if (member.guild.ownerId === member.id)
            return Infinity;

        return member.roles.highest.position;
    }

    public async isUserStaff(member: GuildMember): Promise<boolean>;
    public async isUserStaff(userId: string, guildId: string): Promise<boolean>;
    public async isUserStaff(guildId: string | Guild): Promise<(member: GuildMember) => boolean>;
    public async isUserStaff(
        ...args:
            | [userId: string, guildId: string]
            | [member: GuildMember]
            | [guildId: string | Guild]
    ): Promise<boolean | ((member: GuildMember) => boolean)> {
        let member;
        if (args.length === 2) {
            if (args[0] === args[1]) return true;
            member = await this.getMember(args[1], args[0]);
        } else if (args[0] instanceof GuildMember) {
            member = args[0];
        } else {
            const guildId = typeof args[0] === 'string' ? args[0] : args[0].id;

            if (await this.database.guilds.getSetting(guildId, 'permoverride') !== true)
                return m => m.guild.id === guildId && (m.id === m.guild.ownerId || m.permissions.has('ADMINISTRATOR'));

            const staffperms = await this.database.guilds.getSetting(guildId, 'staffperms') ?? defaultStaff;
            const allow = typeof staffperms === 'string' ? parseInt(staffperms) : staffperms;
            return m => m.guild.id === guildId && (m.id === m.guild.ownerId || m.permissions.has('ADMINISTRATOR') || this.hasPerms(m, allow));
        }

        if (member === undefined) return false;

        if (member.guild.ownerId === member.id) return true;
        if (member.permissions.has('ADMINISTRATOR')) return true;

        if (await this.database.guilds.getSetting(member.guild.id, 'permoverride') === true) {
            let allow = await this.database.guilds.getSetting(member.guild.id, 'staffperms') ?? defaultStaff;
            if (typeof allow === 'string')
                allow = parseInt(allow);
            if (this.hasPerms(member, allow)) {
                return true;
            }
        }
        return false;
    }

    public hasPerms(member: GuildMember, allow?: number | readonly PermissionString[]): boolean {
        allow ??= defaultStaff;
        const newPerm = new Permissions(typeof allow === 'number' ? BigInt(Math.floor(allow)) : allow);
        return member.permissions.any(newPerm);
    }

    public async hasRoles(msg: GuildMember | Message, roles: readonly string[], quiet: boolean, override = true): Promise<boolean> {
        let member: GuildMember;
        let channel: TextBasedChannels | undefined;
        if (msg instanceof GuildMember) {
            member = msg;
        } else {
            if (!guard.isGuildMessage(msg))
                return true;
            member = msg.member;
            channel = msg.channel;
        }
        if (override
            && (this.isOwner(member.id)
                || member.guild.ownerId === member.id
                || member.permissions.has('ADMINISTRATOR'))
        ) {
            return true;
        }

        roles = roles.map(p => p.toLowerCase());
        const guildRoles = member.guild.roles.cache.filter(m =>
            roles.includes(m.name.toLowerCase())
            || roles.some(p => parse.entityId(p, '@&', true) === m.id));

        if (guildRoles.some(r => member.roles.cache.has(r.id)))
            return true;

        if (channel !== undefined && !quiet) {
            if (await this.database.guilds.getSetting(member.guild.id, 'disablenoperms') !== true) {
                const permString = roles.map(m => '`' + m + '`').join(', or ');
                void this.send(channel, `You need the role ${permString} in order to use this command!`);
            }
        }
        return false;
    }

    public isStaff(id: string): boolean {
        return this.cluster.botStaff.staff.has(id);
    }

    public isSupport(id: string): boolean {
        return this.cluster.botStaff.support.has(id);
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
    readonly select: MessageSelectOptionData[];
    page: number;
}

interface MultipleComponentOptions {
    readonly selectId: string;
    readonly cancelId: string;
    readonly placeholder: string | undefined;
    readonly select: MessageSelectOptionData[];
    readonly maxCount?: number;
    readonly minCount?: number;
}

interface ConfirmComponentOptions {
    readonly confirmId: string;
    readonly cancelId: string;
    readonly confirmButton: ConfirmQueryButton;
    readonly cancelButton: ConfirmQueryButton;
}

function createConfirmBody(options: ConfirmComponentOptions): { components: MessageActionRowOptions[]; } {

    const confirm: MessageButtonOptions = {
        ...typeof options.confirmButton === 'string' ? { label: options.confirmButton } : options.confirmButton,
        type: 'BUTTON',
        customId: options.confirmId,
        style: 'SUCCESS'
    };
    const cancel: MessageButtonOptions = {
        ...typeof options.cancelButton === 'string' ? { label: options.cancelButton } : options.cancelButton,
        type: 'BUTTON',
        customId: options.cancelId,
        style: 'DANGER'
    };

    return {
        components: [
            {
                type: 'ACTION_ROW',
                components: [confirm, cancel]
            }
        ]
    };
}

function createMultipleBody(options: MultipleComponentOptions): { components: MessageActionRowOptions[]; } {
    const select: MessageSelectMenuOptions = {
        type: 'SELECT_MENU',
        customId: options.selectId,
        options: options.select,
        placeholder: options.placeholder,
        maxValues: options.maxCount ?? options.select.length,
        minValues: options.minCount ?? 0
    };
    const cancel: MessageButtonOptions = {
        type: 'BUTTON',
        customId: options.cancelId,
        emoji: '✖️',
        style: 'DANGER'
    };

    return {
        components: [
            { type: 'ACTION_ROW', components: [select] },
            { type: 'ACTION_ROW', components: [cancel] }
        ]
    };
}

function createChoiceBody(options: ChoiceComponentOptions): { content: string; components: MessageActionRowOptions[]; } {
    const select: MessageSelectMenuOptions = {
        type: 'SELECT_MENU',
        customId: options.selectId,
        options: options.select,
        placeholder: options.placeholder
    };
    const cancel: MessageButtonOptions = {
        type: 'BUTTON',
        customId: options.cancelId,
        emoji: '✖️',
        style: 'DANGER'
    };

    if (options.lastPage === 0) {
        return {
            content: options.content,
            components: [
                { type: 'ACTION_ROW', components: [select] },
                { type: 'ACTION_ROW', components: [cancel] }
            ]
        };
    }

    const prev: MessageButtonOptions = {
        type: 'BUTTON',
        customId: options.prevId,
        emoji: ':bigarrowleft:876227640976097351',
        style: 'PRIMARY',
        disabled: options.page === 0
    };

    const next: MessageButtonOptions = {

        type: 'BUTTON',
        customId: options.nextId,
        emoji: ':bigarrowright:876227816998461511',
        style: 'PRIMARY',
        disabled: options.page === options.lastPage
    };

    return {
        content: `${options.content}\nPage ${options.page + 1}/${options.lastPage + 1}`.trim(),
        components: [
            { type: 'ACTION_ROW', components: [select] },
            { type: 'ACTION_ROW', components: [prev, cancel, next] }
        ]
    };
}

function getChannelLookupName(channel: KnownChannel): string {
    switch (channel.type) {
        case 'DM': return '🕵️ DM';
        case 'GROUP_DM': return '👥 Group DM';
        case 'GUILD_CATEGORY': return `📁 ${channel.name}`;
        case 'GUILD_NEWS': return `📰 ${channel.name}`;
        case 'GUILD_NEWS_THREAD': return `# ${channel.name}`;
        case 'GUILD_PRIVATE_THREAD': return `# ${channel.name}`;
        case 'GUILD_PUBLIC_THREAD': return `# ${channel.name}`;
        case 'GUILD_STAGE_VOICE': return `🔈 ${channel.name}`;
        case 'GUILD_STORE': return `🛒 ${channel.name}`;
        case 'GUILD_TEXT': return `# ${channel.name}`;
        case 'GUILD_VOICE': return `🔈 ${channel.name}`;
    }
}
