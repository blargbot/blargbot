import { DMContext, SendContext, SendPayload, StoredUser } from '@core/types';
import { AnyChannel, ChannelInteraction, Client as Discord, ClientUser, Constants, DiscordAPIError, EmojiIdentifierResolvable, Guild, GuildChannels, GuildMember, KnownChannel, Message, MessageEmbedAuthor, MessageEmbedOptions, MessageOptions, MessageReaction, Role, Team, TextBasedChannels, User, UserChannelInteraction, Webhook } from 'discord.js';
import moment from 'moment';

import { BaseClient } from './BaseClient';
import { Database } from './database';
import { Logger } from './Logger';
import { metrics } from './Metrics';
import { guard, humanize, parse, snowflake } from './utils';

export class BaseUtilities {
    public get user(): ClientUser { return this.client.discord.user; }
    public get discord(): Discord<true> { return this.client.discord; }
    public get database(): Database { return this.client.database; }
    public get logger(): Logger { return this.client.logger; }
    public get config(): Configuration { return this.client.config; }

    public constructor(
        public readonly client: BaseClient
    ) {
    }

    private async getSendChannel(context: SendContext): Promise<TextBasedChannels> {
        // Process context into a channel and maybe a message
        switch (typeof context) {
            // Id provided, get channel object
            case 'string': {
                const foundChannel = await this.getChannel(context);
                if (foundChannel === undefined)
                    break;
                else if (guard.isTextableChannel(foundChannel))
                    return foundChannel;
                else
                    throw new Error('Cannot send messages to the given channel');
            }
            case 'object':
                // Probably a message provided
                if ('channel' in context)
                    return context.channel;
                // Probably a channel provided
                return context;
        }

        throw new Error('Channel not found');
    }

    public websiteLink(path?: string): string {
        path = path?.replace(/^[/\\]+/, '');
        const scheme = this.config.website.secure ? 'https' : 'http';
        const host = this.config.website.host;
        const port = this.config.website.port === 80 ? '' : `:${this.config.website.port}`;
        return `${scheme}://${host}${port}/${path ?? ''}`;
    }

    public embedifyAuthor(target: GuildMember | User | Guild | Team | StoredUser): MessageEmbedAuthor {
        if (target instanceof User) {
            return {
                iconURL: target.displayAvatarURL({ size: 512, dynamic: true, format: 'png' }),
                name: humanize.fullName(target),
                url: this.websiteLink(target === this.discord.user ? undefined : `user/${target.id}`)
            };
        } else if (target instanceof GuildMember) {
            return {
                iconURL: target.user.displayAvatarURL({ size: 512, dynamic: true, format: 'png' }),
                name: target.displayName,
                url: this.websiteLink(`user/${target.id}`)
            };
        } else if (target instanceof Guild) {
            return {
                iconURL: target.iconURL({ size: 512, dynamic: true, format: 'png' }) ?? undefined,
                name: target.name
            };
        } else if (target instanceof Team) {
            return {
                iconURL: target.iconURL({ size: 512, format: 'png' }) ?? undefined,
                name: target.name,
                url: this.websiteLink()
            };
        } else if ('userid' in target) {
            return {
                iconURL: target.avatarURL,
                name: target.username,
                url: this.websiteLink(`user/${target.userid}`)
            };
        }

        return target; // never
    }

    public async send(context: SendContext, payload: SendPayload): Promise<Message | undefined> {
        metrics.sendCounter.inc();

        let channel = await this.getSendChannel(context);
        const author = typeof context === 'object' && 'author' in context ? context.author : undefined;

        if (typeof payload === 'string')
            payload = { content: payload };
        else if ('attachment' in payload)
            payload = { files: [payload] };
        else if (isEmbed(payload))
            payload = { embeds: [payload] };

        const replyToExecuting = payload.replyToExecuting !== undefined ? delete payload.replyToExecuting : true;
        if (payload.reply === undefined && replyToExecuting && context instanceof Message)
            payload.reply = { messageReference: context, failIfNotExists: false };

        // Send help messages to DMs if the message is marked as a help message
        if (payload.isHelp === true
            && guard.isGuildChannel(channel)
            && await this.database.guilds.getSetting(channel.guild.id, 'dmhelp') === true
            && author !== undefined) {
            await this.send(channel, '📧 DMing you the help 📧');
            payload.content = `Here is the help you requested in ${channel.toString()}>:\n${payload.content ?? ''}`;
            channel = author.dmChannel ?? await author.createDM();
        }

        // Stringifies embeds if we lack permissions to send embeds
        if (payload.embeds !== undefined
            && guard.isGuildChannel(channel)
            && channel.permissionsFor(this.user.id)?.any('EMBED_LINKS') !== true
        ) {
            payload.content = `${payload.content ?? ''}${humanize.embed(payload.embeds)}`;
            delete payload.embeds;
        }

        payload.content = payload.content?.trim();
        if (payload.content?.length === 0)
            payload.content = undefined;

        if (payload.nsfw !== undefined && 'nsfw' in channel && channel.nsfw) {
            payload.content = payload.nsfw;
            payload.embeds = payload.files = undefined;
        }

        if (payload.content === undefined
            && (payload.embeds?.length ?? 0) === 0
            && (payload.files?.length ?? 0) === 0
            && (payload.components?.length ?? 0) === 0) {
            this.logger.error('Tried to send an empty message!');
            throw new Error('No content');
        }

        if (!guard.checkEmbedSize(payload.embeds)) {
            const id = await this.generateOutputPage(payload, channel);
            const output = this.websiteLink('/output');
            payload.content = 'Oops! I tried to send a message that was too long. If you think this is a bug, please report it!\n' +
                '\n' +
                `To see what I would have said, please visit ${output}${id.toString()}`;
            if (payload.embeds !== undefined)
                delete payload.embeds;
        } else if (payload.content !== undefined && !guard.checkMessageSize(payload.content)) {
            payload.files ??= [];
            payload.files.unshift({
                attachment: payload.content,
                name: 'message.txt'
            });
            payload.content = undefined;
        }
        for (const file of payload.files ?? [])
            if (typeof file === 'object' && 'attachment' in file && typeof file.attachment === 'string')
                file.attachment = Buffer.from(file.attachment);

        this.logger.debug('Sending content: ', JSON.stringify(payload));
        try {
            return await channel.send(payload);
        } catch (error: unknown) {
            if (!(error instanceof DiscordAPIError))
                throw error;

            const code = error.code;
            if (!guard.hasProperty(sendErrors, code)) {
                return undefined;
            }

            let result = await sendErrors[code](this, channel, payload, error);
            if (typeof result === 'string' && author !== undefined && await this.canDmErrors(author.id)) {
                if (guard.isGuildChannel(channel))
                    result += `\nGuild: ${channel.guild.name} (${channel.guild.id})`;

                const name = guard.isGuildChannel(channel) ? channel.name : 'PRIVATE CHANNEL';
                result += `\nChannel: ${name} (${channel.id})`;
                result += '\n\nIf you wish to stop seeing these messages, do the command `dmerrors`.';

                await this.sendDM(author.id, {
                    content: result,
                    reply: payload.reply
                });
            }
            return undefined;
        }
    }

    public async sendDM(context: DMContext, payload: SendPayload): Promise<Message | undefined> {
        let user: User | undefined;
        switch (typeof context) {
            case 'string': {
                user = await this.getUser(context);
                break;
            }
            case 'object': {
                if ('author' in context) {
                    user = context.author;
                    break;
                }
                if ('user' in context) {
                    user = context.user;
                    break;
                }
                if ('id' in context) {
                    user = context;
                    break;
                }
                break;
            }
        }

        if (user === undefined)
            throw new Error('Not a user');

        return await this.send(user.dmChannel ?? await user.createDM(), payload);
    }

    public async addReactions(context: Message, reactions: Iterable<EmojiIdentifierResolvable>): Promise<{ success: MessageReaction[]; failed: EmojiIdentifierResolvable[]; }> {
        const results = { success: [] as MessageReaction[], failed: [] as EmojiIdentifierResolvable[] };
        const reacted = new Set<EmojiIdentifierResolvable>();
        let done = false;
        for (const reaction of reactions) {
            if (reacted.size === reacted.add(reaction).size)
                continue;

            if (done) {
                results.failed.push(reaction);
                continue;
            }

            try {
                results.success.push(await context.react(reaction));
            } catch (e: unknown) {
                if (e instanceof DiscordAPIError) {
                    switch (e.code) {
                        case Constants.APIErrors.MAXIMUM_REACTIONS:
                        case Constants.APIErrors.MISSING_PERMISSIONS:
                            done = true;
                        //fallthrough
                        case Constants.APIErrors.REACTION_BLOCKED:
                        case Constants.APIErrors.UNKNOWN_EMOJI:
                            results.failed.push(reaction);
                            continue;
                    }
                }
                throw e;
            }
        }

        return results;
    }

    public async resolveTags(context: ChannelInteraction | UserChannelInteraction | KnownChannel, message: string): Promise<string> {
        const regex = /<[^<>\s]+>/g;
        const promiseMap: { [tag: string]: Promise<string>; } = {};
        let match;
        while ((match = regex.exec(message)) !== null) {
            promiseMap[match[0]] ??= this.resolveTag('channel' in context ? context.channel : context, match[0]);
        }
        const replacements = Object.fromEntries(await Promise.all(Object.entries(promiseMap).map(async e => [e[0], await e[1]] as const)));
        return message.replace(regex, match => replacements[match]);
    }

    public async resolveTag(context: KnownChannel, tag: string): Promise<string> {
        let id: string | undefined;
        if ((id = parse.entityId(tag, '@&')) !== undefined) { // ROLE
            const role = guard.isGuildChannel(context)
                ? await this.getRole(context.guild, id)
                : undefined;

            return `@${role?.name ?? 'UNKNOWN ROLE'}`;
        }
        if ((id = parse.entityId(tag, '@!')) !== undefined) { // USER (NICKNAME)
            if (guard.isGuildChannel(context)) {
                const member = await this.getMember(context.guild, tag.substring(2));
                if (member !== undefined)
                    return member.displayName;
            }
            const user = await this.getUser(id);
            return user === undefined ? 'UNKNOWN USER' : `${user.username}#${user.discriminator}`;
        }
        if ((id = parse.entityId(tag, '@')) !== undefined) { // USER
            const user = await this.getUser(id);
            return user === undefined ? 'UNKNOWN USER' : `${user.username}#${user.discriminator}`;
        }
        if ((id = parse.entityId(tag, '#')) !== undefined) { // CHANNEL
            const channel = await this.getChannel(id);
            return channel !== undefined && guard.isGuildChannel(channel) ? `#${channel.name}` : '';
        }
        if (tag.startsWith('<t:')) { // TIMESTAMP
            const [, val, format = 'f'] = tag.split(':');
            const timestamp = moment.unix(parseInt(val));
            switch (format.substring(0, format.length - 1)) {
                case 't': return timestamp.format('HH:mm');
                case 'T': return timestamp.format('HH:mm:ss');
                case 'd': return timestamp.format('DD/MM/yyyy');
                case 'D': return timestamp.format('DD MMMM yyyy');
                case 'F': return timestamp.format('dddd, DD MMMM yyyy HH:mm');
                case 'R': return moment.duration(timestamp.diff(moment())).humanize(true);
                case 'f': return timestamp.format('DD MMMM yyyy HH:mm');
            }
        }
        if (tag.startsWith('<a:') || tag.startsWith('<:')) { // EMOJI
            return tag.split(':')[1];
        }
        return tag;
    }

    public async generateOutputPage(payload: MessageOptions | string, channel?: TextBasedChannels): Promise<Snowflake> {
        if (typeof payload === 'string')
            payload = { content: payload };

        const id = snowflake.create();
        await this.database.dumps.add({
            id: id.toString(),
            content: payload.content ?? undefined,
            embeds: JSON.stringify(payload.embeds),
            channelid: channel?.id
        });
        return id;
    }

    public async canDmErrors(userId: string): Promise<boolean> {
        const storedUser = await this.database.users.get(userId);
        return storedUser?.dontdmerrors !== true;
    }

    public getOwners(): Iterable<User> {
        const owner = this.discord.application.owner;
        if (owner === null)
            return [];
        if (!('members' in owner))
            return [owner];

        return owner.members
            .filter(m => m.membershipState === 'ACCEPTED' && m.permissions.includes('*'))
            .map(m => m.user)
            .values();
    }

    public isBotOwner(userId: string): boolean {
        for (const owner of this.getOwners())
            if (owner.id === userId)
                return true;
        return false;
    }

    public isBotDeveloper(userId: string): boolean {
        return this.isBotOwner(userId)
            || this.config.discord.users.developers.includes(userId);
    }
    public isBotStaff(userId: string): Promise<boolean> | boolean;
    public async isBotStaff(userId: string): Promise<boolean> {
        if (this.isBotDeveloper(userId))
            return true;
        const police = await this.database.vars.get('police');
        return police?.value.includes(userId) ?? false;
    }

    public isBotSupport(userId: string): Promise<boolean> | boolean;
    public async isBotSupport(userId: string): Promise<boolean> {
        if (await this.isBotStaff(userId))
            return true;
        const support = await this.database.vars.get('support');
        return support?.value.includes(userId) ?? false;
    }

    public async getChannel(channelId: string): Promise<AnyChannel | undefined>;
    public async getChannel(guild: string | Guild, channelId: string): Promise<GuildChannels | undefined>;
    public async getChannel(...args: [string] | [string | Guild, string]): Promise<AnyChannel | undefined> {
        const _args = args.length === 2 ? args : [undefined, args[0]] as const;

        const guild = _args[0];
        const channelId = parse.entityId(_args[1], '@!?', true) ?? '';
        if (channelId === '')
            return undefined;

        try {
            if (guild === undefined)
                return await this.discord.channels.fetch(channelId) ?? undefined;
            const _guild = typeof guild === 'string' ? await this.getGuild(guild) : guild;
            return await _guild?.channels.fetch(channelId) ?? undefined;
        } catch (err: unknown) {
            if (err instanceof DiscordAPIError && err.code === Constants.APIErrors.UNKNOWN_CHANNEL)
                return undefined;
            throw err;
        }
    }

    public async findChannels(guild: string | Guild, query?: string): Promise<GuildChannels[]> {
        if (typeof guild === 'string')
            guild = await this.getGuild(guild) ?? guild;

        if (typeof guild === 'string')
            return [];

        if (query === undefined)
            return [...guild.channels.cache.values()] as GuildChannels[];

        const channel = await this.getChannel(guild, query);
        if (channel !== undefined)
            return [channel];

        return findBest<GuildChannels>(
            guild.channels.cache.filter(guard.isGuildChannel).values(),
            (c) => this.channelMatchScore(c, query)
        );
    }

    public channelMatchScore(channel: KnownChannel, query: string): number {
        const normalizedQuery = query.toLowerCase();

        if (guard.isGuildChannel(channel)) {
            const normalizedName = channel.name.toLowerCase();
            if (channel.name === query) return Infinity;
            if (channel.name.startsWith(query)) return 1000;
            if (normalizedName.startsWith(normalizedQuery)) return 100;
            if (channel.name.includes(query)) return 10;
            if (normalizedName.includes(normalizedQuery)) return 1;
        } else if (guard.isPrivateChannel(channel) && 'recipient' in channel) {
            return this.userMatchScore(channel.recipient, query);
        }
        return 0;

    }

    public async getUser(userId: string): Promise<User | undefined> {
        userId = parse.entityId(userId, '@!?', true) ?? '';
        if (userId === '')
            return undefined;

        try {
            return await this.discord.users.fetch(userId);
        } catch (err: unknown) {
            if (err instanceof DiscordAPIError) {
                switch (err.code) {
                    case Constants.APIErrors.INVALID_FORM_BODY:
                        this.logger.error('Error while getting user', userId, err);
                    // fallthrough
                    case Constants.APIErrors.MISSING_ACCESS:
                    case Constants.APIErrors.UNKNOWN_USER:
                        return undefined;
                }
            }
            throw err;
        }
    }

    public async getGuild(guildId: string): Promise<Guild | undefined> {
        guildId = parse.entityId(guildId) ?? '';
        if (guildId === '')
            return undefined;

        try {
            return await this.discord.guilds.fetch(guildId);
        } catch (err: unknown) {
            if (err instanceof DiscordAPIError) {
                switch (err.code) {
                    case Constants.APIErrors.INVALID_FORM_BODY:
                        this.logger.error('Error while getting guild', guildId, err);
                    // fallthrough
                    case Constants.APIErrors.MISSING_ACCESS:
                    case Constants.APIErrors.UNKNOWN_GUILD:
                        return undefined;
                }
            }
            throw err;
        }
    }

    public async getMessage(channel: string | KnownChannel, messageId: string, force?: boolean): Promise<Message | undefined> {
        messageId = parse.entityId(messageId) ?? '';
        if (messageId === '')
            return undefined;

        const foundChannel = typeof channel === 'string' ? await this.getChannel(channel) : channel;

        if (foundChannel === undefined || !guard.isTextableChannel(foundChannel))
            return undefined;

        try {
            return await foundChannel.messages.fetch(messageId, { force });
        } catch (err: unknown) {
            if (err instanceof DiscordAPIError) {
                switch (err.code) {
                    case Constants.APIErrors.INVALID_FORM_BODY:
                        this.logger.error('Error while getting message', messageId, 'in channel', foundChannel.id, err);
                    // fallthrough
                    case Constants.APIErrors.MISSING_ACCESS:
                    case Constants.APIErrors.UNKNOWN_MESSAGE:
                        return undefined;
                }
            }
            throw err;
        }
    }

    public async getMember(guild: string | Guild, userId: string): Promise<GuildMember | undefined> {
        userId = parse.entityId(userId) ?? '';
        if (userId === '')
            return undefined;

        if (typeof guild === 'string')
            guild = await this.getGuild(guild) ?? guild;

        if (typeof guild === 'string')
            return undefined;

        try {
            return await guild.members.fetch(userId);
        } catch (error: unknown) {
            if (error instanceof DiscordAPIError) {
                switch (error.code) {
                    case Constants.APIErrors.UNKNOWN_MEMBER:
                    case Constants.APIErrors.UNKNOWN_USER:
                    case Constants.APIErrors.MISSING_ACCESS:
                    case Constants.APIErrors.INVALID_FORM_BODY:
                        return undefined;
                }
            }
            throw error;
        }
    }

    public async findMembers(guild: string | Guild, query?: string): Promise<GuildMember[]> {
        if (typeof guild === 'string')
            guild = await this.getGuild(guild) ?? guild;

        if (typeof guild === 'string')
            return [];

        if (query === undefined)
            return [...guild.members.cache.values()];

        const member = await this.getMember(guild, query);
        if (member !== undefined)
            return [member];

        return findBest(guild.members.cache.values(), m => this.memberMatchScore(m, query));
    }

    public async getWebhook(guild: string | Guild, webhookId: string): Promise<Webhook | undefined> {
        if (typeof guild === 'string')
            guild = await this.getGuild(guild) ?? guild;

        if (typeof guild === 'string')
            return undefined;

        try {
            const webhooks = await guild.fetchWebhooks();
            return webhooks.get(webhookId);
        } catch (error: unknown) {
            if (error instanceof DiscordAPIError) {
                switch (error.code) {
                    case Constants.APIErrors.MISSING_PERMISSIONS:
                    case Constants.APIErrors.MISSING_ACCESS:
                        return undefined;
                }
            }
            throw error;
        }
    }

    public async findWebhooks(guild: string | Guild, query?: string): Promise<Webhook[]> {
        if (typeof guild === 'string')
            guild = await this.getGuild(guild) ?? guild;

        if (typeof guild === 'string')
            return [];

        let webhooks;
        try {
            webhooks = await guild.fetchWebhooks();
        } catch (error: unknown) {
            if (error instanceof DiscordAPIError) {
                switch (error.code) {
                    case Constants.APIErrors.MISSING_PERMISSIONS:
                    case Constants.APIErrors.MISSING_ACCESS:
                        return [];
                }
            }
            throw error;
        }

        if (query === undefined)
            return [...webhooks.values()];

        return findBest(webhooks.values(), w => this.webhookMatchScore(w, query));
    }

    public async getSender(guild: string | Guild, senderId: string): Promise<GuildMember | Webhook | undefined> {
        senderId = parse.entityId(senderId) ?? '';
        if (senderId === '')
            return undefined;

        if (typeof guild === 'string')
            guild = await this.getGuild(guild) ?? guild;

        if (typeof guild === 'string')
            return undefined;

        const member = await this.getMember(guild, senderId);
        if (member !== undefined)
            return member;

        return await this.getWebhook(guild, senderId);
    }

    public async findSenders(guild: string | Guild, query?: string): Promise<Array<GuildMember | Webhook>> {
        if (typeof guild === 'string')
            guild = await this.getGuild(guild) ?? guild;

        if (typeof guild === 'string')
            return [];

        const result = await Promise.all([
            this.findMembers(guild),
            this.findWebhooks(guild)
        ]);

        if (query === undefined)
            return result.flat();

        return findBest(result.flat(), s => s instanceof GuildMember ? this.memberMatchScore(s, query) : this.webhookMatchScore(s, query));
    }

    public memberMatchScore(member: GuildMember, query: string): number {
        let score = this.userMatchScore(member.user, query);
        const normalizedDisplayname = member.displayName.toLowerCase();
        const normalizedQuery = query.toLowerCase();

        if (humanize.fullName(member.user) === query) return Infinity;
        if (member.displayName.startsWith(query)) score += 100;
        if (normalizedDisplayname.startsWith(normalizedQuery)) score += 10;
        if (normalizedDisplayname.includes(normalizedQuery)) score += 1;
        return score;
    }

    public userMatchScore(user: User, query: string): number {
        let score = 0;
        const normalizedUsername = user.username.toLowerCase();
        const normalizedQuery = query.toLowerCase();

        if (humanize.fullName(user) === query) return Infinity;
        if (user.username.startsWith(query)) score += 100;
        if (normalizedUsername.startsWith(normalizedQuery)) score += 10;
        if (normalizedUsername.includes(normalizedQuery)) score += 1;
        return score;
    }

    public webhookMatchScore(webhook: Webhook, query: string): number {
        let score = 0;
        const normalizedName = webhook.name.toLowerCase();
        const normalizedQuery = query.toLowerCase();

        if (webhook.name === query) return Infinity;
        if (webhook.name.startsWith(query)) score += 100;
        if (normalizedName.startsWith(normalizedQuery)) score += 10;
        if (normalizedName.includes(normalizedQuery)) score += 1;
        return score;
    }

    public async getRole(guild: string | Guild, roleId: string): Promise<Role | undefined> {
        roleId = parse.entityId(roleId, '@&', true) ?? '';
        if (roleId === '')
            return undefined;

        if (typeof guild === 'string')
            guild = await this.getGuild(guild) ?? guild;
        if (typeof guild === 'string')
            return undefined;

        try {
            return await guild.roles.fetch(roleId) ?? undefined;
        } catch (error: unknown) {
            if (error instanceof DiscordAPIError && error.code === Constants.APIErrors.UNKNOWN_ROLE)
                return undefined;
            throw error;
        }
    }

    public async findRoles(guild: string | Guild, query?: string): Promise<Role[]> {
        if (typeof guild === 'string')
            guild = await this.getGuild(guild) ?? guild;

        if (typeof guild === 'string')
            return [];

        if (query === undefined)
            return [...guild.roles.cache.values()];

        const role = await this.getRole(guild, query);
        if (role !== undefined)
            return [role];

        return findBest(guild.roles.cache.values(), r => this.roleMatchScore(r, query));
    }

    public roleMatchScore(role: Role, query: string): number {
        const normalizedQuery = query.toLowerCase();
        const normalizedName = role.name.toLowerCase();

        if (role.name === query) return Infinity;
        if (role.name.startsWith(query)) return 1000;
        if (normalizedName.startsWith(normalizedQuery)) return 100;
        if (role.name.includes(query)) return 10;
        if (normalizedName.includes(normalizedQuery)) return 1;
        return 0;
    }
}

const sendErrors = {
    [Constants.APIErrors.UNKNOWN_CHANNEL]: () => { /* console.error('10003: Channel not found. ', channel); */ },
    [Constants.APIErrors.CANNOT_SEND_EMPTY_MESSAGE]: (util: BaseUtilities, _: unknown, payload: SendPayload) => { util.logger.error('50006: Tried to send an empty message:', payload); },
    [Constants.APIErrors.CANNOT_MESSAGE_USER]: () => { /* console.error('50007: Can\'t send a message to this user!'); */ },
    [Constants.APIErrors.CANNOT_SEND_MESSAGES_IN_VOICE_CHANNEL]: () => { /* console.error('50008: Can\'t send messages in a voice channel!'); */ },
    [Constants.APIErrors.MISSING_PERMISSIONS]: (util: BaseUtilities) => {
        util.logger.warn('50013: Tried sending a message, but had no permissions!');
        return 'I tried to send a message in response to your command, ' +
            'but didn\'t have permission to speak. If you think this is an error, ' +
            'please contact the staff on your guild to give me the `Send Messages` permission.';
    },
    [Constants.APIErrors.MISSING_ACCESS]: (util: BaseUtilities) => {
        util.logger.warn('50001: Missing Access');
        return 'I tried to send a message in response to your command, ' +
            'but didn\'t have permission to see the channel. If you think this is an error, ' +
            'please contact the staff on your guild to give me the `Read Messages` permission.';
    },
    [Constants.APIErrors.EMBED_DISABLED]: async (util: BaseUtilities, channel: TextBasedChannels) => {
        util.logger.warn('50004: Tried embeding a link, but had no permissions!');
        await util.send(channel, 'I don\'t have permission to embed links! This will break several of my commands. Please give me the `Embed Links` permission. Thanks!');
        return 'I tried to send a message in response to your command, ' +
            'but didn\'t have permission to create embeds. If you think this is an error, ' +
            'please contact the staff on your guild to give me the `Embed Links` permission.';
    },

    // try to catch the mystery of the autoresponse-object-in-field-value error
    // https://stop-it.get-some.help/9PtuDEm.png
    [Constants.APIErrors.INVALID_FORM_BODY]: (util: BaseUtilities, channel: TextBasedChannels, payload: SendPayload, error: DiscordAPIError) => {
        util.logger.error(`${channel.id}|${guard.isGuildChannel(channel) ? channel.name : 'PRIVATE CHANNEL'}|${JSON.stringify(payload)}`, error);
    }
} as const;

function isEmbed(payload: SendPayload): payload is MessageEmbedOptions {
    return typeof payload !== 'string' && embedKeys.some(k => k in payload);
}

const embedKeys = Object.keys<{ [P in keyof MessageEmbedOptions]-?: true }>({
    author: true,
    color: true,
    description: true,
    fields: true,
    footer: true,
    image: true,
    thumbnail: true,
    timestamp: true,
    title: true,
    url: true,
    video: true
});

function findBest<T>(options: Iterable<T>, evaluator: (value: T) => number): T[] {
    const result = [];
    const matches = [];

    for (const option of options) {
        const score = evaluator(option);
        if (score === Infinity)
            matches.push(option);

        if (score > 0)
            result.push({ option, score });
    }

    if (matches.length === 1)
        return matches;

    return result.sort((a, b) => b.score - a.score)
        .map(r => r.option);
}
