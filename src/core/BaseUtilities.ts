import { AdvancedMessageContent, AnyChannel, Channel, ChannelInteraction, AnyMessage, Client as ErisClient, EmbedOptions, ExtendedUser, Member, MessageFile, Textable, User, UserChannelInteraction } from 'eris';
import { BaseClient } from './BaseClient';
import { guard, snowflake, stringify } from '../utils';
import { MessageAwaiter } from '../structures/MessageAwaiter';
import request from 'request';
import { metrics } from './Metrics';
import { Database } from './database';


export type SendContext = UserChannelInteraction | ChannelInteraction | (Textable & Channel) | string
export type SendEmbed = EmbedOptions & { asString?: string }
export type SendFiles = MessageFile | Array<MessageFile>
export type SendPayload = {
    disableEveryone?: boolean,
    embed?: SendEmbed,
    nsfw?: string,
    isHelp?: boolean
} & AdvancedMessageContent | string | boolean

export class BaseUtilities {
    public get user(): ExtendedUser { return this.client.discord.user; }
    public get discord(): ErisClient { return this.client.discord; }
    public get database(): Database { return this.client.database; }
    public get logger(): CatLogger { return this.client.logger; }
    public get config(): Configuration { return this.client.config; }
    public readonly messageAwaiter: MessageAwaiter;

    public constructor(
        public readonly client: BaseClient
    ) {
        this.messageAwaiter = new MessageAwaiter(this.logger);
    }

    private async getSendChannel(context: SendContext): Promise<Textable & Channel> {
        // Process context into a channel and maybe a message
        switch (typeof context) {
            // Id provided, get channel object
            case 'string':
                const foundChannel = this.discord.getChannel(context)
                    ?? await this.discord.getRESTChannel(context);

                if (guard.isTextableChannel(foundChannel))
                    return foundChannel;
                else if (foundChannel)
                    throw new Error('Cannot send messages to the given channel');

                break;
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
        path = path.replace(/^[\/\\]+/, '');
        const scheme = this.config.website.secure ? 'https' : 'http';
        const host = this.config.website.host;
        return `${scheme}://${host}/${path}`;
    }

    public async send(context: SendContext, payload?: SendPayload, files?: SendFiles): Promise<AnyMessage | null> {
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

        this.logger.log(payload);
        if (payload.disableEveryone) {
            if (!payload.allowedMentions) {
                payload.allowedMentions = {};
            }
            payload.allowedMentions.everyone = false;
        }

        // Send help messages to DMs if the message is marked as a help message
        if (payload.isHelp
            && guard.isGuildChannel(channel)
            && await this.database.guilds.getSetting(channel.guild.id, 'dmhelp')
            && author !== undefined) {
            await this.send(channel, '📧 DMing you the help 📧');
            payload.content = `Here is the help you requested in ${channel.mention}:\n${payload.content ?? ''}`;
            channel = await author.getDMChannel();
        }

        // Stringifies embeds if we lack permissions to send embeds
        if (payload.embed !== undefined
            && guard.isGuildChannel(channel)
            && !channel.permissionsOf(this.user.id).has('embedLinks')
        ) {
            payload.content = `${payload.content ?? ''}${stringify.embed(payload.embed)}`;
            delete payload.embed;
        }

        if (files != null && !Array.isArray(files))
            files = [files];

        if (!payload.content)
            payload.content = '';
        else
            payload.content = payload.content.trim();
        if (payload.nsfw && guard.isGuildChannel(channel) && channel.nsfw) {
            payload.content = payload.nsfw;
            payload.embed = files = undefined;
        }

        if (!payload.content && !payload.embed && (!files || files.length == 0)) {
            this.logger.error('Tried to send an empty message!');
            throw new Error('No content');
        }

        if (payload.content.length > 2000 || !guard.checkEmbedSize(payload.embed)) {
            const id = await this.generateOutputPage(payload, channel);
            const output = this.websiteLink('/output');
            payload.content = 'Oops! I tried to send a message that was too long. If you think this is a bug, please report it!\n' +
                '\n' +
                `To see what I would have said, please visit ${output}${id}`;
            if (payload.embed)
                delete payload.embed;
        }

        this.logger.debug('Sending content: ', JSON.stringify(payload));
        try {
            return await this.discord.createMessage(channel.id, payload, files);
        } catch (error) {
            let response = error.response;
            if (typeof response !== 'object')
                response = JSON.parse(error.response || '{}');
            if (!sendErrors.hasOwnProperty(response.code)) {
                this.logger.error(error.response, error.stack);
                return null;
            }

            let result = await sendErrors[response.code](this, channel, payload, files);
            if (typeof result === 'string' && author && await this.canDmErrors(author.id)) {
                if (guard.isGuildChannel(channel))
                    result += `\nGuild: ${channel.guild.name} (${channel.guild.id})`;

                const name = guard.isGuildChannel(channel) ? channel.name : 'PRIVATE CHANNEL';
                result += `\nChannel: ${name} (${channel.id})`;
                result += '\n\nIf you wish to stop seeing these messages, do the command `dmerrors`.';

                await this.sendDM(author.id, result);
            }
            return null;
        }
    }

    public async sendFile(context: SendContext, payload: SendPayload, fileUrl: string): Promise<AnyMessage | null> {
        const i = fileUrl.lastIndexOf('/');
        if (i === -1)
            return null;

        const filename = fileUrl.substring(i + 1, fileUrl.length);
        try {
            const response = await new Promise<string | Buffer>((res, rej) => request({ uri: fileUrl, encoding: null }, (err, _, bod) => err ? rej(err) : res(bod)));
            return await this.send(context, payload, {
                name: filename,
                file: response
            });
        } catch (err) {
            this.logger.error(err);
            return null;
        }
    }

    public async sendDM(context: AnyMessage | User | Member | string, message: SendPayload, files?: SendFiles): Promise<AnyMessage | null> {
        let userid: string;
        switch (typeof context) {
            case 'string': userid = context; break;
            case 'object':
                if ('author' in context) { userid = context.author.id; break; }
                if ('user' in context) { userid = context.user.id; break; }
                if ('id' in context) { userid = context.id; break; }
            default:
                throw new Error('Not a user');

        }

        const privateChannel = await this.discord.getDMChannel(userid);
        return await this.send(privateChannel, message, files);
    }

    public async generateOutputPage(payload: SendPayload, channel?: Channel): Promise<Snowflake> {
        switch (typeof payload) {
            case 'string': payload = { content: payload }; break;
            case 'boolean': payload = { content: payload.toString() }; break;
            case 'object': break;
            default: payload = {}; break;
        }
        const id = snowflake.create();
        await this.database.dumps.add({
            id: id.toString(),
            content: payload.content,
            embeds: JSON.stringify([payload.embed]),
            channelid: channel?.id
        });
        return id;
    }

    public async canDmErrors(userId: string): Promise<boolean> {
        const storedUser = await this.database.users.get(userId);
        return !storedUser?.dontdmerrors;
    }
}


const sendErrors: { [key: string]: (utilities: BaseUtilities, channel: AnyChannel | Channel, payload: SendPayload, files?: SendFiles) => Promise<string | void> | string | void } = {
    '10003': () => { /* console.error('10003: Channel not found. ', channel); */ },
    '50006': (util, _, payload) => { util.logger.error('50006: Tried to send an empty message:', payload); },
    '50007': () => { /* console.error('50007: Can\'t send a message to this user!'); */ },
    '50008': () => { /* console.error('50008: Can\'t send messages in a voice channel!'); */ },

    '50013': (util) => {
        util.logger.warn('50013: Tried sending a message, but had no permissions!');
        return 'I tried to send a message in response to your command, ' +
            'but didn\'t have permission to speak. If you think this is an error, ' +
            'please contact the staff on your guild to give me the `Send Messages` permission.';
    },
    '50001': (util) => {
        util.logger.warn('50001: Missing Access');
        return 'I tried to send a message in response to your command, ' +
            'but didn\'t have permission to see the channel. If you think this is an error, ' +
            'please contact the staff on your guild to give me the `Read Messages` permission.';
    },
    '50004': (util, channel) => {
        util.logger.warn('50004: Tried embeding a link, but had no permissions!');
        void util.send(channel.id, 'I don\'t have permission to embed links! This will break several of my commands. Please give me the `Embed Links` permission. Thanks!');
        return 'I tried to send a message in response to your command, ' +
            'but didn\'t have permission to create embeds. If you think this is an error, ' +
            'please contact the staff on your guild to give me the `Embed Links` permission.';
    },

    // try to catch the mystery of the autoresponse-object-in-field-value error
    // https://stop-it.get-some.help/9PtuDEm.png
    '50035': (util, channel, payload) => {
        util.logger.warn('%s|%s: %o', channel.id, 'name' in channel ? channel.name : 'PRIVATE CHANNEL', payload);
    }
};