const Context = require('../Structures/Context');
const Resolve = require('./Resolve');
const Snowflake = require('./Snowflake');
const Random = require('./Random');

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
async function decodeAndSend(dest, key, args, file) {
    return await send(dest, await decode(dest, key, args), file);
}

/**
 * Decodes a locale key
 * @param {(Message|Channel|Guild|User|Member|Context|String)} dest A destination resolveable.
 * @param {String} key The locale key
 * @param {Object} [args={}] Additional arguments for decoding
 */
async function decode(dest, key, args = {}) {
    let { user, guild } = Resolve.generic(dest);
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
    let template = _discord.LocaleManager.getTemplate(localeName, key);
    if (template === null) {
        return await decode(dest, 'error.keyundef', { key });
    }

    let recursiveRegex = /\[\[(.+?)\]\]/, match;
    while ((match = recursiveRegex.exec(template)) != null) {
        template = template.replace(new RegExp('\\[\\[' + match[1] + '\\]\\]', 'g'), await decode(dest, match[1], args));
    };

    if (Array.isArray(template)) {
        template = template[Random.getRandomInt(0, template.length - 1)];
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
async function send(dest, content = '', file) {
    let { channel, user, guild } = Resolve.generic(dest);
    let destination = await Resolve.destination(dest);

    if (channel == undefined && guild == undefined) throw new Error('No such channel or guild');
    else if (channel == undefined && guild != undefined) channel = _discord.getChannel(guild.id);
    if (channel == undefined) throw new Error('No such channel');
    if (typeof content == 'string') {
        content = {
            content
        };
    }
    if (content.content == undefined) content.content = '';
    try {
        if (content.content.length > 2000) {
            return await destination.createMessage(await decode(dest, 'error.messagetoolong'), {
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
            timestamp: _dep.moment()
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
        await _discord.createMessage(_constants.ERROR_CHANNEL, {
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
function awaitMessage(dest, callback, timeout = 300000) {
    const { channel, user } = Resolve.generic(dest);
    return new Promise((resolve, reject) => {
        if (_discord.awaitedMessages[channel.id] == undefined)
            _discord.awaitedMessages[channel.id] = {};

        callback = callback || function (msg2) {
            return msg2.author.id == user.id;
        };

        let timer;
        if (timeout > 0)
            timer = setTimeout(function () {
                delete _discord.awaitedMessages[channel.id][user.id];
                reject(new Error('Await timed out after ' + timeout + 'ms'));
            }, timeout);

        if (_discord.awaitedMessages[channel.id][user.id] != undefined) {
            _discord.awaitedMessages[channel.id][user.id].kill();
        }

        _discord.awaitedMessages[channel.id][user.id] = {
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
 * @param {Number} type The type of the message - 0 for create, 1 for update, 2 for delete
 */
async function insertMessage(msg, type = 0) {
    if (msg.channel)
        return await _r.table('chatlogs').insert({
            id: type == 0 ? msg.id : Snowflake.make(),
            content: msg.content,
            attachment: msg.attachments && msg.attachments.length > 0 ? msg.attachments[0].url : undefined,
            userid: msg.author ? msg.author.id : 'unknown',
            msgid: msg.id,
            channelid: msg.channel.id,
            guildid: msg.guild ? msg.guild.id : 'DM',
            msgtime: _r.epochTime(msg.timestamp / 1000),
            type
        });
}

/**
 * Gets the most recent entry in the database for the provided message id
 * @param {String} msgId The message to get
 * @returns {Object} The entry
 */
async function getLatestCachedMessage(msgId) {
    const rawMsg = (await _r.table('chatlogs').getAll(msgId, { index: 'msgid' }).orderBy(_r.desc('id')).limit(1))[0];
    if (rawMsg)
        return constructMessage({
            id: msgId,
            timestamp: rawMsg.type == 0 ? rawMsg.msgtime : Snowflake.unmake(msgId),
            channel_id: rawMsg.channelid,
            content: rawMsg.content,
            edited_timestamp: rawMsg.type != 1 ? rawMsg.msgtime : undefined,
            mentions: [],
            role_mentions: []
        });
}

async function constructMessage(data) {
    return new _dep.Eris.Message(data, _discord);
}

module.exports = {
    send, decode, awaitMessage, insertMessage, getLatestCachedMessage
};