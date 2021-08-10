import { SendContext, SendPayload } from '@core/types';
import { Channel, Client as Discord, ClientUser, Constants, DiscordAPIError, Guild, GuildMember, Message, TextBasedChannels, User } from 'discord.js';

import { BaseClient } from './BaseClient';
import { Database } from './database';
import { Logger } from './Logger';
import { metrics } from './Metrics';
import { guard, humanize, snowflake } from './utils';

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
                const foundChannel = await this.getGlobalChannel(context);
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

    public websiteLink(path: string): string {
        path = path.replace(/^[/\\]+/, '');
        const scheme = this.config.website.secure ? 'https' : 'http';
        const host = this.config.website.host;
        return `${scheme}://${host}/${path}`;
    }

    public async send(context: SendContext, payload: SendPayload | undefined): Promise<Message | undefined> {
        metrics.sendCounter.inc();

        let channel = await this.getSendChannel(context);
        const author = typeof context === 'object' && 'author' in context ? context.author : undefined;

        switch (typeof payload) {
            case 'string':
                payload = { content: payload };
                break;
            case 'boolean':
            case 'number':
                payload = { content: payload.toString() };
                break;
            case 'object':
                break;
            default: payload = {};
        }

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

        if (payload.content === undefined && (payload.embeds?.length ?? 0) === 0 && (payload.files?.length ?? 0) === 0) {
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

        this.logger.debug('Sending content: ', JSON.stringify(payload));
        try {
            return await channel.send(payload);
        } catch (error: unknown) {
            if (!(error instanceof DiscordAPIError))
                throw error;

            const code = error.code;
            if (!guard.hasProperty(sendErrors, code)) {
                this.logger.error(error);
                return undefined;
            }

            let result = sendErrors[code](this, channel, payload);
            if (typeof result === 'string' && author !== undefined && await this.canDmErrors(author.id)) {
                if (guard.isGuildChannel(channel))
                    result += `\nGuild: ${channel.guild.name} (${channel.guild.id})`;

                const name = guard.isGuildChannel(channel) ? channel.name : 'PRIVATE CHANNEL';
                result += `\nChannel: ${name} (${channel.id})`;
                result += '\n\nIf you wish to stop seeing these messages, do the command `dmerrors`.';

                await this.sendDM(author.id, result);
            }
            return undefined;
        }
    }

    public async sendDM(context: Message | User | GuildMember | string, payload: SendPayload): Promise<Message | undefined> {
        let user: User | undefined;
        switch (typeof context) {
            case 'string': {
                user = await this.getGlobalUser(context);
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

    public async generateOutputPage(payload: SendPayload, channel?: TextBasedChannels): Promise<Snowflake> {
        switch (typeof payload) {
            case 'string':
                payload = { content: payload };
                break;
            case 'boolean':
                payload = { content: payload.toString() };
                break;
            case 'object':
                break;
            default:
                payload = {};
                break;
        }
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

    public isDeveloper(userId: string): boolean {
        return this.config.discord.users.owner === userId
            || this.config.discord.users.developers.includes(userId);
    }

    public isStaff(id: string): Promise<boolean> | boolean {
        return this.database.vars.get('police')
            .then(police => police?.value.includes(id) ?? false);
    }
    public isSupport(id: string): Promise<boolean> | boolean {
        return this.database.vars.get('support')
            .then(support => support?.value.includes(id) ?? false);
    }
    public async getGlobalChannel(channelId: string): Promise<Channel | undefined> {
        try {
            return await this.discord.channels.fetch(channelId) ?? undefined;
        } catch (err: unknown) {
            if (err instanceof DiscordAPIError && err.code === Constants.APIErrors.UNKNOWN_CHANNEL)
                return undefined;
            throw err;
        }
    }
    public async getGlobalUser(userId: string): Promise<User | undefined> {
        try {
            return await this.discord.users.fetch(userId);
        } catch (err: unknown) {
            if (err instanceof DiscordAPIError && err.code === Constants.APIErrors.UNKNOWN_USER)
                return undefined;
            throw err;
        }
    }
    public async getGlobalGuild(guildId: string): Promise<Guild | undefined> {
        try {
            return await this.discord.guilds.fetch(guildId);
        } catch (err: unknown) {
            if (err instanceof DiscordAPIError && err.code === Constants.APIErrors.UNKNOWN_GUILD)
                return undefined;
            throw err;
        }
    }
    public async getMessage(channel: string | Channel, messageId: string): Promise<Message | undefined> {
        const foundChannel = typeof channel === 'string' ? await this.getGlobalChannel(channel) : channel;

        if (foundChannel === undefined || !guard.isTextableChannel(foundChannel))
            return undefined;

        try {
            return await foundChannel.messages.fetch(messageId);
        } catch (err: unknown) {
            if (err instanceof DiscordAPIError && err.code === Constants.APIErrors.UNKNOWN_MESSAGE)
                return undefined;
            throw err;
        }
    }

    public async getGlobalMessage(channel: string | Channel, messageId: string): Promise<Message | undefined> {
        const foundChannel = typeof channel === 'string' ? await this.getGlobalChannel(channel) : channel;
        return foundChannel === undefined ? undefined : await this.getMessage(foundChannel, messageId);
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
    [Constants.APIErrors.EMBED_DISABLED]: (util: BaseUtilities, channel: TextBasedChannels) => {
        util.logger.warn('50004: Tried embeding a link, but had no permissions!');
        void util.send(channel, 'I don\'t have permission to embed links! This will break several of my commands. Please give me the `Embed Links` permission. Thanks!');
        return 'I tried to send a message in response to your command, ' +
            'but didn\'t have permission to create embeds. If you think this is an error, ' +
            'please contact the staff on your guild to give me the `Embed Links` permission.';
    },

    // try to catch the mystery of the autoresponse-object-in-field-value error
    // https://stop-it.get-some.help/9PtuDEm.png
    [Constants.APIErrors.INVALID_FORM_BODY]: (util: BaseUtilities, channel: TextBasedChannels, payload: SendPayload) => {
        util.logger.warn(`${channel.id}|${guard.isGuildChannel(channel) ? channel.name : 'PRIVATE CHANNEL'}|${JSON.stringify(payload)}`);
    }
} as const;
