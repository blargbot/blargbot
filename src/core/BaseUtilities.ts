import { AdvancedMessageContent, AnyChannel, Channel, Client as ErisClient, EmbedOptions, ExtendedUser, Member, Message, MessageFile, TextableChannel, User } from 'eris';
import { BaseClient } from './BaseClient';
import { snowflake } from '../utils';
import { MessageAwaiter } from '../structures/MessageAwaiter';
import request from 'request';
import { metrics } from './Metrics';
import { Database } from './database';

export type SendContext = Pick<Message, 'channel' | 'content' | 'author'> | TextableChannel | string
export type SendEmbed = EmbedOptions & { asString?: string }
export type SendFiles = MessageFile | Array<MessageFile>
export type SendPayload = {
    disableEveryone?: boolean,
    embed?: SendEmbed,
    embeds?: Array<SendEmbed>,
    nsfw?: string
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

    public async send(context: SendContext, payload?: SendPayload, files?: SendFiles): Promise<Message | null> {
        let channel: AnyChannel | Channel;
        let message: Pick<Message, 'channel' | 'content' | 'author'> | undefined;
        metrics.sendCounter.inc();

        // Process context into a channel and maybe a message
        switch (typeof context) {
            // Id provided, get channel object
            case 'string':
                channel = this.discord.getChannel(context);
                if (!channel) {
                    context = (/(\d+)/.exec(context) || [])[1];
                    channel = new Channel({ id: context });
                }
                break;
            case 'object':
                // Probably a message provided
                if ('channel' in context) {
                    channel = context.channel;
                    message = context;
                }
                // Probably a channel provided
                else {
                    channel = context;
                }
                break;
            // Invalid option given
            default:
                throw new Error('Channel not found');
        }

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

        if ('permissionsOf' in channel
            && payload.embed
            && 'asString' in payload.embed
            && !channel.permissionsOf(this.user.id).has('embedLinks')
        ) {
            payload.content = `${payload.content ?? ''}${payload.embed.asString ?? ''}`;
            delete payload.embed;
        }

        if (files != null && !Array.isArray(files))
            files = [files];

        if (!payload.content)
            payload.content = '';
        else
            payload.content = payload.content.trim();
        if (payload.nsfw && !('nsfw' in channel && channel.nsfw)) {
            payload.content = payload.nsfw;
            payload.embed = payload.embeds = files = undefined;
        }

        if (!payload.content && !payload.embed && !payload.embeds && (!files || files.length == 0)) {
            this.logger.error('Tried to send an empty message!');
            throw new Error('No content');
        }

        if (payload.content.length > 2000) {
            const id = await this.generateOutputPage(payload, channel);
            const output = this.client.config.general.isbeta ? 'http://localhost:8085/output/' : 'https://blargbot.xyz/output/';
            payload.content = 'Oops! I tried to send a message that was too long. If you think this is a bug, please report it!\n' +
                '\n' +
                `To see what I would have said, please visit ${output}${id}`;
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
            if (typeof result === 'string' && message && await this.canDmErrors(message.author.id)) {
                if ('channel' in message) {
                    if ('guild' in message.channel)
                        result += `\nGuild: ${message.channel.guild.name} (${message.channel.guild.id})`;

                    const name = 'name' in channel ? channel.name : 'PRIVATE CHANNEL';
                    result += `\nChannel: ${name} (${message.channel.id})`;
                }
                if (message.content && message.content.length > 100)
                    result += `\nCommand: ${message.content.substring(0, 100)}...`;
                else
                    result += `\nCommand: ${message.content}`;

                result += '\n\nIf you wish to stop seeing these messages, do the command `dmerrors`.';

                await this.sendDM(message.author.id, result);
            }
            return null;
        }
    }

    public async sendFile(context: SendContext, payload: SendPayload, fileUrl: string): Promise<Message | null> {
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

    public async sendDM(context: Message | User | Member | string, message: SendPayload, files?: SendFiles): Promise<Message | null> {
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