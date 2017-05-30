const Context = require('../Structures/Context');
const BaseHelper = require('./BaseHelper');

const moment = require('moment-timezone');
const Eris = require('eris');

class MessageHelper extends BaseHelper {
    constructor(client) {
        super(client);
    }

    /**
     * Decodes and sends a locale key
     * @param {(Message|Channel|Guild|User|Member|Context|String)} dest A destination resolveable.
     * @param {Member} dest a member object (DM)
     * @param {String} key The locale key
     * @param {Object} [args] Additional arguments for decoding
     * @param {Object} [file] A file to send
     * @param {String} file.name The file's name
     * @param {Buffer} file.file The file's buffer
     */
    async decodeAndSend(dest, key, args, file) {
        return await this.send(dest, await this.decode(dest, key, args), file);
    }

    /**
     * Decodes a locale key
     * @param {(Message|Channel|Guild|User|Member|Context|String)} dest A destination resolveable.
     * @param {String} key The locale key
     * @param {Object} [args={}] Additional arguments for decoding
     */
    async decode(dest, key, args = {}) {
        let { user, guild } = this.client.Helpers.Resolve.generic(dest);
        let localeName;
        if (guild) {
            let guildLocale = await guild.data.getLocale();
            if (guildLocale) localeName = guildLocale.locale;
        }
        if (user) {
            let userLocale = await user.data.getLocale();
            if (userLocale) localeName = userLocale.locale;
        }
        if (!localeName) {
            localeName = 'en_US';
        }
        let template = this.client.LocaleManager.getTemplate(localeName, key);
        if (template === null) {
            return await this.decode(dest, 'error.keyundef', { key });
        }

        let recursiveRegex = /\[\[(.+?)\]\]/, match;
        while ((match = recursiveRegex.exec(template)) != null) {
            template = template.replace(new RegExp('\\[\\[' + match[1] + '\\]\\]', 'g'), await this.decode(dest, match[1], args));
        };

        if (Array.isArray(template)) {
            template = template[this.client.Helpers.Random.getRandomInt(0, template.length - 1)];
        }

        for (const arg of Object.keys(args)) {
            let regexp = new RegExp('\{\{' + arg + '\}\}', 'g');
            template = template.replace(regexp, args[arg]);
        }

        return template;
    }

    /**
     * Sends a message to the provided destination
     * @param {(Message|Channel|Guild|User|Member|Context|String)} dest A destination resolveable.
     * @param {String} [content=''] 
     * @param {Object} [file] The file to send
     * @param {String} file.name The file's name
     * @param {Buffer} file.file The file's buffer
     */
    async send(dest, content = '', file) {
        let { channel, user, guild } = this.client.Helpers.Resolve.generic(dest);
        let destination = await this.client.Helpers.Resolve.destination(dest);

        if (channel == undefined && guild == undefined) throw new Error('No such channel or guild');
        else if (channel == undefined && guild != undefined) channel = this.client.getChannel(guild.id);
        if (channel == undefined) throw new Error('No such channel');
        if (typeof content == 'string') {
            content = {
                content
            };
        }
        if (content.content == undefined) content.content = '';
        try {
            if (content.content.length > 2000) {
                return await destination.createMessage(await this.decode(dest, 'error.messagetoolong'), {
                    file: (content.content || '') + '\n\n' + JSON.stringify(content.embed || {}, null, 2),
                    name: 'output.json'
                });
            } else if (content.content.length >= 0) {
                return await destination.createMessage(content, file);
            }
        } catch (err) {
            let response;
            if (err.response) {
                try {
                    response = JSON.parse(err.response);
                } catch (err) { }
            }
            let Embed = {
                title: response !== undefined ? `${err.name}: ${response.code} - ${response.message}` : err.name,
                description: err.stack.substring(0, 250),
                fields: [],
                color: 0xAD1111,
                timestamp: moment()
            };
            if (channel.guild) {
                Embed.fields.push({
                    name: 'Guild',
                    value: `${channel.guild.name}\n${channel.guild.id}`
                });
            }
            Embed.fields.push({
                name: 'Channel',
                value: `${channel.name}\n${channel.id}`
            });
            Embed.fields.push({
                name: 'Content',
                value: `${(content.content || '[]').substring(0, 100)}`
            });
            if (user) {
                Embed.author = {
                    name: user.fullNameId,
                    icon_url: user.avatarURL
                };
            }
            await this.client.createMessage(this.client.Constants.ERROR_CHANNEL, {
                embed: Embed
            }, {
                    file: JSON.stringify(content, null, 2),
                    name: 'error-output.json'
                });
            throw err;
        }
    }

    /**
     * @callback verifyCallback
     * The verification callback for awaitMessage
     * @param {Message} msg2 The new message input
     * @returns {Boolean} Whether or not to finalize the await
     */

    /**
     * Awaits a message response
     * @param {(Message|Channel|Guild|User|Member|Context|String)} dest A destination resolveable.
     * @param {verifyCallback} callback A verification callback
     * @param {Number} [timeout=300000] The amount of time before the await expires. Set to -1 to disable 
     */
    awaitMessage(dest, callback, timeout = 300000) {
        const { channel, user } = this.client.Helpers.Resolve.generic(dest);
        return new Promise((resolve, reject) => {
            if (this.client.awaitedMessages[channel.id] == undefined)
                this.client.awaitedMessages[channel.id] = {};

            callback = callback || function (msg2) {
                return msg2.author.id == user.id;
            };

            let timer;
            if (timeout > 0)
                timer = setTimeout(function () {
                    delete this.client.awaitedMessages[channel.id][user.id];
                    reject(new Error('Await timed out after ' + timeout + 'ms'));
                }, timeout);

            if (this.client.awaitedMessages[channel.id][user.id] != undefined) {
                this.client.awaitedMessages[channel.id][user.id].kill();
            }

            this.client.awaitedMessages[channel.id][user.id] = {
                callback,
                execute: function (msg2) {
                    if (timer != undefined) clearTimeout(timer);
                    resolve(msg2);
                },
                kill: function () {
                    if (timer != undefined) clearTimeout(timer);
                    reject(new Error('Got overwritten by same channel-author pair'));
                }
            };
        });
    }

    /**
     * Inserts a message into the database
     * @param {Message} msg The message object 
     * @param {String} type The type of the message - one of `create`, `update`, `delete`
     */
    async insertMessage(msg, type = 'create') {
        if (msg.channel && msg.guild && msg.author)
            return await this.client.models.ChatLog.create({
                id: type === 'create' ? msg.id : this.client.Helpers.Snowflake.make(),
                guildId: msg.guild.id,
                channelId: msg.channel.id,
                userId: msg.author.id,
                msgId: msg.id,
                type,
                content: msg.content,
                embeds: msg.embeds,
                attachmentUrl: msg.attachments && msg.attachments.length > 0 ? msg.attachments[0].url : undefined
            });
    }

    /**
     * Gets the most recent entry in the database for the provided message id
     * @param {String} msgId The message to get
     * @returns {Object} The entry
     */
    async getLatestCachedMessage(msgId) {
        const rawMsg = this.client.models.ChatLog.findOne({
            where: {
                msgId
            },
            order: [
                ['id', 'DESC']
            ]
        });
        if (rawMsg)
            return this.constructMessage({
                id: msgId,
                timestamp: this.client.Helpers.Snowflake.unmake(rawMsg.msgId),
                channel_id: rawMsg.channelid,
                content: rawMsg.content,
                edited_timestamp: rawMsg.type != 'create' ? this.client.Helpers.Snowflake.unmake(rawMsg.id) : undefined,
                mentions: [],
                role_mentions: []
            });
    }

    async constructMessage(data) {
        return new Eris.Message(data, this.client);
    }

}


module.exports = MessageHelper;