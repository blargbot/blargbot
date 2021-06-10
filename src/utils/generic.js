/*
 * @Author: stupid cat
 * @Date: 2017-05-07 19:22:33
 * @Last Modified by: RagingLink
 * @Last Modified time: 2020-06-16 00:00:57
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const colors = require('../../res/colors') || {};
const moment = require('moment-timezone');
const snekfetch = require('snekfetch');
const unorm = require('unorm');
const limax = require('limax');
const { User, Channel, Member, Message, Permission } = require('eris');
const twemoji = require('twemoji');
const request = require('request');
const isSafeRegex = require('safe-regex');
const { emojify } = require('node-emoji');

bu.compareStats = (a, b) => {
    if (a.uses < b.uses)
        return -1;
    if (a.uses > b.uses)
        return 1;
    return 0;
};

bu.awaitQuery = async function (msg, content, check, timeout, label) {
    let query = await bu.createQuery(msg, content, check, timeout, label);
    return await query.response;
};

bu.createQuery = async function (msg, content, check, timeout, label) {
    if (timeout == null || typeof timeout != "number")
        timeout = 300000;
    let timeoutMessage = `Query canceled${label ? ' in ' + label : ''} after ${moment.duration(timeout).humanize()}.`;
    return bu.createPrompt(msg, content, check, timeout, timeoutMessage);
};

bu.awaitPrompt = async function (msg, content, check, timeout, timeoutMessage) {
    let prompt = await bu.createPrompt(msg, content, check, timeout, timeoutMessage);
    return await prompt.response;
};

bu.createPrompt = async function (msg, content, check, timeout, timeoutMessage) {
    let prompt = await bu.send(msg, content);
    let response = bu.awaitMessage([msg.channel.id], [msg.author.id], check, timeout);

    response.catch(function (error) {
        if (timeoutMessage && typeof timeoutMessage == "string" && error instanceof TimeoutError) {
            bu.send(msg, timeoutMessage);
        }
    });

    return {
        prompt,
        response
    };
};

let awaitMessageCounter = 0;

bu.awaitMessage = async function (channels, users, check, timeout) {
    if (!Array.isArray(channels))
        channels = [channels];
    if (!Array.isArray(users))
        users = [users];
    if (typeof check != "function")
        check = function () { return true; };
    if (timeout == null || typeof timeout != "number")
        timeout = 300000;

    let eventName = `await_message_${awaitMessageCounter++}`;
    let eventReferences = [];

    for (const channel of channels) {
        for (const user of users) {
            let c = bu.awaitMessages[channel] || (bu.awaitMessages[channel] = {});
            let u = c[user] || (c[user] = []);
            u.push(eventName);
            eventReferences.push(u);
        }
    }

    bu.emitter.removeAllListeners(eventName);

    console.debug(`awaiting message | channels: [${channels}] users: [${users}] timeout: ${timeout}`);

    return await new Promise(async function (resolve, reject) {
        let timeoutId = setTimeout(function () {
            reject(new TimeoutError(timeout));
        }, timeout);

        bu.emitter.on(eventName, async function (message) {
            try {
                if (await check(message)) {
                    clearTimeout(timeoutId);
                    resolve(message);
                }
            } catch (err) {
                clearTimeout(timeoutId);
                reject(err);
            }
        });
    }).finally(function () {
        bu.emitter.removeAllListeners(eventName);
        for (const ref of eventReferences) {
            let index = ref.indexOf(eventName);
            if (index != -1) {
                ref.splice(index, 1);
            }
        }
    });
};

let awaitReactionCounter = 0;

bu.awaitReact = async function (messages, users, reactions, check, timeout) {
    if (!Array.isArray(messages))
        messages = [messages];
    if (!Array.isArray(users))
        users = [users];
    if (reactions) {
        if (!Array.isArray(reactions))
            reactions = [reactions];
        reactions = reactions.map(r => r.replace(/[<>]/g, ''));
    }
    if (typeof check != "function")
        check = function () { return true; };
    if (timeout == null || typeof timeout != "number")
        timeout = 300000;

    let eventName = `await_reaction_${awaitMessageCounter++}`;
    let eventReferences = [];

    for (const message of messages) {
        let msg = bu.awaitReactions[message] || (bu.awaitReactions[message] = {});
        for (const user of users) {
            let usr = msg[user] || (msg[user] = []);
            usr.push(eventName);
            eventReferences.push(usr);
        }
    }

    bu.emitter.removeAllListeners(eventName);

    console.debug(`awaiting reaction | messages: [${messages}] users: [${users}] reactions: ${JSON.stringify(reactions)} timeout: ${timeout}`);

    const SANITIZED = /(\w+:\d+)/;
    const watchFor = reactions ? reactions.map(r => {
        if (SANITIZED.test(r)) return r.match(SANITIZED)[1];
        else return r;
    }) : null;

    return await new Promise(async function (resolve, reject) {
        let timeoutId = setTimeout(function () {
            reject(new TimeoutError(timeout));
        }, timeout);

        bu.emitter.on(eventName, async function (message, emoji, user) {
            let sanitized = emoji;
            if (SANITIZED.test(sanitized)) sanitized = sanitized.match(SANITIZED)[1];

            console.log('Received reaction event:', eventName, sanitized, watchFor);
            try {
                if (reactions && reactions.length > 0 && (!watchFor || !watchFor.includes(sanitized)))
                    return;
                if (await check(message, user, emoji)) {
                    clearTimeout(timeoutId);
                    resolve({ message, channel: message.channel, user, emoji });
                }
            } catch (err) {
                clearTimeout(timeoutId);
                reject(err);
            }
        });
    }).finally(function () {
        bu.emitter.removeAllListeners(eventName);
        for (const ref of eventReferences) {
            let index = ref.indexOf(eventName);
            if (index != -1) {
                ref.splice(index, 1);
            }
        }
    });
};

class TimeoutError extends Error {
    constructor(timeout) {
        super("Action timed out");
        this.timeout = timeout;
    }
}
bu.TimeoutError = TimeoutError;


function getId(text) {
    if (/[0-9]{17,23}/.test(text)) {
        return text.match(/([0-9]{17,23})/)[1];
    } else return null;
}
/**
 * Checks if a user has a role with a specific name
 * @param msg - the message (Message)
 * @param perm - the name of the role required (String)
 * @param quiet - if true, won't output an error (Boolean)
 * @returns {boolean}
 */
bu.hasPerm = async (msg, perm, quiet, override = true) => {
    let member;
    if (msg instanceof Member) {
        member = msg;
    } else {
        if (!msg.channel.guild) return true;
        member = msg.member;
    }
    if (override && ((member.id === bu.CAT_ID && bu.catOverrides) ||
        member.guild.ownerID == member.id ||
        member.permissions.json.administrator)) {
        return true;
    }

    var roles = member.guild.roles.filter(m => {
        if (Array.isArray(perm) ?
            perm.map(q => q.toLowerCase()).indexOf(m.name.toLowerCase()) > -1 :
            m.name.toLowerCase() == perm.toLowerCase()) {
            return true;
        } else {
            let role;

            if (Array.isArray(perm)) {
                role = [];
                for (let i = 0; i < perm.length; i++) {
                    let id = getId(perm[i]);
                    if (id !== null) role.push(id);
                }
                if (role.length == 0) return false;
            } else {
                role = getId(perm);
                if (role === null) return false;
            };
            return Array.isArray(role) ?
                role.indexOf(m.id) > -1 :
                m.id == role;
        }
    });
    for (var i = 0; i < roles.length; i++) {
        if (member.roles.indexOf(roles[i].id) > -1) {
            return true;
        }
    }
    if (!quiet) {
        let guild = await bu.getGuild(msg.guild.id);
        if (!guild.settings.disablenoperms) {
            let permString = Array.isArray(perm) ? perm.map(m => '`' + m + '`').join(', or ') : '`' + perm + '`';
            bu.send(msg, `You need the role ${permString} in order to use this command!`);
        }
    }
    return false;
};

bu.hasRole = (msg, roles, override = true) => {
    let member;
    if (msg instanceof Member) {
        member = msg;
    } else {
        if (!msg.channel) return false;
        if (!msg.channel.guild) return true;
        if (!msg.member) return false;
        member = msg.member;
    }

    if (override && ((member.id === bu.CAT_ID && bu.catOverrides) ||
        member.guild.ownerID == msg.member.id ||
        member.permissions.json.administrator)) {
        return true;
    }
    if (!Array.isArray(roles)) roles = [roles];
    for (var i = 0; i < roles.length; i++) {
        if (member.roles.indexOf(roles[i]) > -1) {
            return true;
        }
    }
    return false;
};

bu.addReactions = async function (channelId, messageId, reactions) {
    let errors = {};
    for (const reaction of new Set(reactions || [])) {
        try {
            await bot.addMessageReaction(channelId, messageId, reaction);
        } catch (e) {
            if (!errors[e.code]) errors[e.code] = { error: e, reactions: [] };
            switch (e.code) {
                case 50013:
                    errors[e.code].reactions.push(...new Set(reactions));
                    return errors;
                default:
                    errors[e.code].reactions.push(reaction);
                    break;
            }
        }
    }

    return errors;
};

bu.generateOutputPage = async function (payload, channel) {
    if (typeof payload === 'string') payload = {
        content: payload
    };
    const id = bu.makeSnowflake();
    await bu.cclient.execute(`INSERT INTO message_outputs (id, content, embeds, channelid) VALUES (:id, :content, :embeds, :channelid) USING TTL 604800`, {
        id,
        content: payload.content.toString(),
        embeds: JSON.stringify([payload.embed]),
        channelid: channel ? channel.id : null
    }, { prepare: true });
    return id;
};

/**
 * @param {*} context The context to send. Can be a channelId, Message or Channel object
 * @param {String|Object} payload The payload to send. Can be a string or an object
 * @param {Object|Object[]} files The files to attach to the message
 */
bu.send = async function (context, payload, files) {
    let channel, message;
    bu.messageStats++;

    // Process context into a channel and maybe a message
    switch (typeof context) {
        // Id provided, get channel object
        case "string":
            channel = await bot.getChannel(context);
            if (!channel) {
                context = context.match(/(\d+)/)[1];
                channel = new Channel({ id: context });
            }
            break;
        case "object":
            // Probably a message provided
            if (context.channel) {
                channel = context.channel;
                message = context;
            }
            // Probably a channel provided
            else {
                channel = context;
            }
            break;
        // Invalid option given
        default: channel = null;
    }

    if (channel == null) throw new Error("Channel not found");
    switch (typeof payload) {
        case "string": payload = { content: payload }; break;
        case 'boolean': case 'number': payload = { content: payload.toString() }; break;
        case "object": break;
        default: payload = {};
    }

    console.log(payload);
    if (payload.disableEveryone) {
        if (!payload.allowedMentions) {
            payload.allowedMentions = {};
        }
        payload.allowedMentions.everyone = false;
    }

    if ('permissionsOf' in channel &&
        payload.embed &&
        'asString' in payload.embed &&
        !channel.permissionsOf(bot.user.id).has('embedLinks')) {
        payload.content = (payload.content || '') + payload.embed.asString;
        delete payload.embed;
    }

    if (files != null && !Array.isArray(files))
        files = [files];

    if (!payload.content) payload.content = '';
    else payload.content = payload.content.trim();
    if (payload.nsfw && !channel.nsfw) {
        payload.content = payload.nsfw;
        payload.embed = payload.embeds = files = null;
    }

    if (!payload.content && !payload.embed && !payload.embeds && (!files || files.length == 0)) {
        console.error('Tried to send an empty message!');
        return new Error('No content');
    }

    if (payload.content.length > 2000) {
        // (files || (files = [])).push({
        //     file: Buffer.from(payload.content.toString()),
        //     name: 'output.txt'
        // });
        let id = await bu.generateOutputPage(payload, channel);
        payload.content = 'Oops! I tried to send a message that was too long. If you think this is a bug, please report it!\n\nTo see what I would have said, please visit ' +
            (config.general.isbeta ? 'http://localhost:8085/output/' : 'https://blargbot.xyz/output/') + id;
    }

    console.debug('Sending content: ', JSON.stringify(payload));
    let sendPromise = bot.createMessage(channel.id, payload, files);
    return await sendPromise.catch(async function (error) {
        let response = error.response;
        if (typeof response !== 'object') {
            try {
                response = JSON.parse(error.response || "{}");
            } catch (err) {
                console.error("Error parsing error response code", err);
                bot.createMessage('197529405659021322', "Error parsing error response code\n" + err.stack + '\n\n' + error.response);
                return;
            }
        }
        if (!bu.send.catch.hasOwnProperty(response.code))
            return console.error(error.response, error.stack);

        let result = await bu.send.catch[response.code](channel, payload, files);
        if (typeof result === 'string' && message && await bu.canDmErrors(message.author.id)) {
            if (message.guild) result += `\nGuild: ${message.guild.name} (${message.guild.id})`;
            result += `\nChannel: ${message.channel.name} (${message.channel.id})`;
            if (message.content && message.content.length > 100) result += `\nCommand: ${message.content.substring(0, 100)}...`;
            else result += `\nCommand: ${message.content}`;
            result += '\n\nIf you wish to stop seeing these messages, do the command `dmerrors`.';

            await bu.sendDM(message.author.id, result);
        } else if (typeof result === 'object' && 'id' in result) {
            return result;
        }
    });
};

/**
 * A collection of handlers for response codes from a failed message send
 */
bu.send.catch = {
    '10003': function (channel) { /* console.error('10003: Channel not found. ', channel); */ },
    '50006': function (channel, payload) { console.error('50006: Tried to send an empty message:', payload); },
    '50007': function () { /* console.error('50007: Can\'t send a message to this user!'); */ },
    '50008': function () { /* console.error('50008: Can\'t send messages in a voice channel!'); */ },

    '50013': function () {
        console.warn('50013: Tried sending a message, but had no permissions!');
        return 'I tried to send a message in response to your command, ' +
            'but didn\'t have permission to speak. If you think this is an error, ' +
            'please contact the staff on your guild to give me the `Send Messages` permission.';
    },
    '50001': function () {
        console.warn('50001: Missing Access');
        return 'I tried to send a message in response to your command, ' +
            'but didn\'t have permission to see the channel. If you think this is an error, ' +
            'please contact the staff on your guild to give me the `Read Messages` permission.';
    },
    '50004': function (channel) {
        console.warn('50004: Tried embeding a link, but had no permissions!');
        bu.send(channel, 'I don\'t have permission to embed links! This will break several of my commands. Please give me the `Embed Links` permission. Thanks!');
        return 'I tried to send a message in response to your command, ' +
            'but didn\'t have permission to create embeds. If you think this is an error, ' +
            'please contact the staff on your guild to give me the `Embed Links` permission.';
    },

    // try to catch the mystery of the autoresponse-object-in-field-value error
    // https://stop-it.get-some.help/9PtuDEm.png
    '50035': function (channel, payload) {
        console.warn('%s|%s: %o', channel.id, channel.name, payload);
    }
};

bu.canDmErrors = async function (userId) {
    let storedUser = await r.table('user').get(userId);
    return !storedUser || !storedUser.dontdmerrors;
};

/**
 * Sends a message to a DM.
 * @param user - the user id (String) or message object (Object)
 * @param message - the message to send (String)
 * @param file - the file to send (Object|null)
 * @returns {Message}
 */
bu.sendDM = async function (user, message, file) {
    let userid = user;
    if (user instanceof Message) {
        userid = user.author.id;
    }
    if (message.length == 0) {
        console.info('Tried to send a message with no content.');
        return Error('No content');
    }
    bu.messageStats++;
    message = emojify(message);

    if (message.length > 2000) {
        message = 'Oops! I tried to send a message that was too long. If you think this is a bug, please report it!';
    }
    try {
        let privateChannel = await bot.getDMChannel(userid);
        if (!file) return await bu.send(privateChannel, message);
        else return await bu.send(privateChannel, message, file);
    } catch (err) {
        console.error(err.stack);
        return err;
    }
};

/**
 * @param {String} userId
 */
bu.getUserById = async function (userId) {
    let match = userId.match(/\d{17,21}/);
    if (match) {
        let user = bot.users.get(match[0]);
        if (user) {
            return user;
        } else {
            try {
                return await bot.getRESTUser(match[0]);
            } catch (err) { return null; }
        }
    }
    return null;
};

/**
 * Gets a user from a name (smartly)
 * @param msg - the message (Message)
 * @param name - the name of the user (String)
 * @param args - additional arguments, if a bool is provided defaults to quiet (Boolean|Object)
 * @param args.quiet - if true, won't respond with multiple users found (Boolean)
 * @param args.suppress - if true, won't output 'no user found' or 'query cancelled' messages (Boolean)
 * @returns {User|null}
 */
bu.getUser = async function (msg, name, args = {}) {
    if (!name) return null;
    if (typeof args !== 'object')
        args = { quiet: args };
    var userList;
    var userId;
    var discrim;

    let user = await bu.getUserById(name);
    if (user)
        return user;

    if (/^.*#\d{4}$/.test(name)) {
        discrim = name.match(/^.*#(\d{4}$)/)[1];
        name = name.substring(0, name.length - 5);
    }
    //userList =
    userList = msg.channel.guild.members.filter(m => (m.user.username &&
        m.user.username.toLowerCase().indexOf(name.toLowerCase()) > -1 &&
        (discrim != undefined ? m.user.discriminator == discrim : true)) ||
        ((m.nick) &&
            m.nick.toLowerCase().indexOf(name) > -1 &&
            (discrim != undefined ? m.user.discriminator == discrim : true)));

    userList.sort(function (a, b) {
        let thingy = 0;
        if (a.user.username.toLowerCase().indexOf(name.toLowerCase()) > -1 && a.user.username.startsWith(name)) {
            thingy += 100;
        }
        if (a.nick && a.nick.toLowerCase().indexOf(name.toLowerCase()) > -1 && a.nick.startsWith(name)) {
            thingy += 100;
        }
        if (b.user.username.toLowerCase().indexOf(name.toLowerCase()) > -1 && b.user.username.startsWith(name)) {
            thingy -= 100;
        }
        if (b.nick && b.nick.toLowerCase().indexOf(name.toLowerCase()) > -1 && b.nick.startsWith(name)) {
            thingy -= 100;
        }
        if (a.user.username.toLowerCase().indexOf(name.toLowerCase()) > -1 &&
            a.user.username.toLowerCase().startsWith(name.toLowerCase())) {
            thingy += 10;
        }
        if (a.nick && a.nick.toLowerCase().indexOf(name.toLowerCase()) > -1 &&
            a.nick.toLowerCase().startsWith(name.toLowerCase())) {
            thingy += 10;
        }
        if (b.user.username.toLowerCase().indexOf(name.toLowerCase()) > -1 &&
            b.user.username.toLowerCase().startsWith(name.toLowerCase())) {
            thingy -= 10;
        }
        if (b.nick && b.nick.toLowerCase().indexOf(name.toLowerCase()) > -1 &&
            b.nick.toLowerCase().startsWith(name.toLowerCase())) {
            thingy -= 10;
        }
        if (a.user.username.indexOf(name) > -1) {
            thingy++;
        }
        if (a.nick && a.nick.indexOf(name)) {
            thingy++;
        }
        if (b.user.username.indexOf(name) > -1) {
            thingy--;
        }
        if (b.nick && b.nick.indexOf(name)) {
            thingy--;
        }
        return -thingy;
    });
    //  console.debug(userList.map(m => m.user.username));

    if (userList.length == 1) {
        return userList[0].user;
    } else if (userList.length == 0) {
        if (!args.quiet && !args.suppress) {
            if (args.onSendCallback) args.onSendCallback();
            await bu.send(msg, `No users found${args.label ? ' in ' + args.label : ''}.`);
        }
        return null;
    } else {
        if (!args.quiet) {
            let matches = userList.map(m => { return { content: `${m.user.username}#${m.user.discriminator} - ${m.user.id}`, value: m.user }; });
            let lookupResponse = await bu.createLookup(msg, 'user', matches, args);
            return lookupResponse;
        } else {
            return null;
        }
    }
};

bu.getMessage = async function (channelId, messageId) {
    if (/^\d{17,23}$/.test(messageId)) {
        let channel = bot.getChannel(channelId);
        let messageAttempt = channel.messages.get(messageId);
        if (messageAttempt) return messageAttempt;
        try {
            return await bot.getMessage(channelId, messageId);
        } catch (e) { }
    }
    return null;
};

bu.getRole = async function (msg, name, args = {}) {
    if (typeof args !== 'object')
        args = { quiet: args };
    if (/\d{17,23}/.test(name))
        name = name.match(/\d{17,23}/)[0];
    if (msg.channel.guild.roles.get(name)) {
        return msg.channel.guild.roles.get(name);
    }
    let roleList = msg.channel.guild.roles.filter(m => (m.name &&
        m.name.toLowerCase().indexOf(name.toLowerCase()) > -1));

    roleList.sort(function (a, b) {
        let thingy = 0;
        if (a.name.toLowerCase().indexOf(name.toLowerCase()) > -1 && a.name.startsWith(name)) {
            thingy += 100;
        }
        if (b.name.toLowerCase().indexOf(name.toLowerCase()) > -1 && b.name.startsWith(name)) {
            thingy -= 100;
        }
        if (a.name.toLowerCase().indexOf(name.toLowerCase()) > -1 &&
            a.name.toLowerCase().startsWith(name.toLowerCase())) {
            thingy += 10;
        }
        if (b.name.toLowerCase().indexOf(name.toLowerCase()) > -1 &&
            b.name.toLowerCase().startsWith(name.toLowerCase())) {
            thingy -= 10;
        }
        if (a.name.indexOf(name) > -1) {
            thingy++;
        }
        if (b.name.indexOf(name) > -1) {
            thingy--;
        }
        return -thingy;
    });
    //  console.debug(userList.map(m => m.user.username));

    if (roleList.length == 1) {
        return roleList[0];
    } else if (roleList.length == 0) {
        if (!args.quiet && !args.suppress)
            bu.send(msg, `No roles found.`);
        return null;
    } else {
        if (!args.quiet) {
            let matches = roleList.map(r => { return { content: `${r.name} - ${r.color.toString(16)} (${r.id})`, value: r }; });
            let lookupResponse = await bu.createLookup(msg, 'role', matches, args);
            return lookupResponse;
        } else {
            return null;
        }
    }
};

bu.getMessage = async function (channelId, messageId) {
    if (/^\d{17,23}$/.test(messageId)) {
        try {
            return await bot.getMessage(channelId, messageId);
        } catch (e) { }
    }
    return null;
};

/**
 * Saves the config file
 */
bu.saveConfig = () => {
    bu.emitter.emit('saveConfig');
};

/**
 * Reloads the user list (only for irc)
 */
bu.reloadUserList = () => {
    bu.emitter.emit('ircUserList');
};

/**
 * Gets a random integer within the range
 * @param min - minimum value (int)
 * @param max - maximum value (int)
 * @returns {int}
 */
bu.getRandomInt = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

bu.sendFile = (channelid, message, url) => {
    var i = url.lastIndexOf('/');
    if (i != -1) {
        var filename = url.substring(i + 1, url.length);
        request({
            uri: url,
            encoding: null
        }, function (err, res, body) {
            bu.send(channelid, message, {
                name: filename.split('size')[0],
                file: body
            });
        });
    }
};

/**
 * Creates an uptime string
 * @param moment1 - start time
 * @param moment2 - end time
 * @returns {string}
 */
bu.createTimeDiffString = (moment1, moment2) => {
    var diff = moment.duration(moment1.diff(moment2));
    return `${diff.days() > 0 ? diff.days() + ' days, ' : ''}${diff.hours() > 0 ? diff.hours() + ' hours, ' : ''}${diff.minutes()} minutes, and ${diff.seconds()} seconds`;
};

/**
 * Gets how much memory the bot is currently using
 * @returns {number}
 */
bu.getMemoryUsage = () => {
    var memory = process.memoryUsage();
    return memory.rss / 1024 / 1024;
};

bu.bans = {};

bu.unbans = {};

bu.getPosition = (member) => {
    let role = member.guild.roles.get(member.roles.sort((a, b) => member.guild.roles.get(b).position - member.guild.roles.get(a).position)[0]);
    return role ? role.position : 0;
};

bu.isBotHigher = (member) => {
    let botPos = bu.getPosition(member.guild.members.get(bot.user.id));
    let memPos = bu.getPosition(member);
    return botPos > memPos;
};

bu.logAction = async function (guild, user, mod, type, reason, color = 0x17c484, fields) {
    let isArray = Array.isArray(user);
    if (Array.isArray(reason)) reason = reason.join(' ');
    let val = await bu.guildSettings.get(guild.id, 'modlog');
    if (val && val !== 'false') {
        let storedGuild = await bu.getGuild(guild.id);
        let caseid = 0;
        if (storedGuild.modlog.length > 0) {
            caseid = storedGuild.modlog.length;
        }
        let users = isArray ?
            user.map(u => `${u.username}#${u.discriminator} (${u.id})`).join('\n') :
            `${user.username}#${user.discriminator} (${user.id})`;
        reason = reason || `Responsible moderator, please do \`reason ${caseid}\` to set.`;

        let embed = {
            title: `Case ${caseid}`,
            color: color,
            fields: [{
                name: 'Type',
                value: type,
                inline: true
            }, {
                name: 'Reason',
                value: reason,
                inline: true
            }],
            timestamp: moment()
        };
        if (fields != undefined && Array.isArray(fields)) {
            for (const field of fields) {
                embed.fields.push(field);
            }
        }
        if (mod) {
            embed.footer = {
                text: `${bu.getFullName(mod)} (${mod.id})`,
                icon_url: mod.avatarURL
            };
        }
        if (isArray) {
            embed.description = users;
        } else {
            embed.author = {
                name: users,
                icon_url: user.avatarURL
                // url: `https://blargbot.xyz/user/${user.id}`
            };
        }
        let moderator = mod ? `${mod.username}#${mod.discriminator}` : 'Unknown';
        var message = `**Case ${caseid}**
**Type:** ${type}
**User:** ${users}
**Reason:** ${reason}
**Moderator:** ${moderator}`;

        let msg = await bu.send(val, {
            embed: embed
        });
        let cases = storedGuild.modlog;
        if (!Array.isArray(cases)) {
            cases = [];
        }
        cases.push({
            caseid: caseid,
            modid: mod ? mod.id : null,
            msgid: msg ? msg.id : '',
            reason: reason || null,
            type: type || 'Generic',
            userid: isArray ? user.map(u => u.id).join(',') : user.id
        });


        await r.table('guild').get(guild.id).update({
            modlog: cases
        }).run();
    }
};

bu.issueWarning = async function (user, guild, count, params) {
    let storedGuild = await bu.getGuild(guild.id);
    if (count == undefined) count = 1;
    if (params == undefined) params = {};
    if (!storedGuild.warnings) storedGuild.warnings = {};
    if (!storedGuild.warnings.users) storedGuild.warnings.users = {};
    if (!storedGuild.warnings.users[user.id]) storedGuild.warnings.users[user.id] = 0;
    let type = 0;
    let error = undefined;
    storedGuild.warnings.users[user.id] += count;
    if (storedGuild.warnings.users[user.id] < 0) storedGuild.warnings.users[user.id] = 0;
    let warningCount = storedGuild.warnings.users[user.id];
    const member = guild.members.get(user.id);
    if (member && bu.isBotHigher(member))
        if (storedGuild.settings.banat && storedGuild.settings.banat > 0 && warningCount >= storedGuild.settings.banat) {
            if (!bu.bans[guild.id])
                bu.bans[guild.id] = {};
            bu.bans[guild.id][user.id] = {
                mod: bot.user,
                type: 'Auto-Ban',
                reason: `Exceeded Warning Limit (${warningCount}/${storedGuild.settings.banat})`
            };
            try {
                await guild.banMember(user.id, 0, `[ Auto-Ban ] Exceeded warning limit (${warningCount}/${storedGuild.settings.banat})`);
            } catch (e) { error = e; }
            storedGuild.warnings.users[user.id] = undefined;
            type = 1;
        } else if (storedGuild.settings.kickat && storedGuild.settings.kickat > 0 && warningCount >= storedGuild.settings.kickat) {
            try {
                await guild.kickMember(user.id, `[ Auto-Kick ] Exceeded warning limit (${warningCount}/${storedGuild.settings.kickat})`);
            } catch (e) { error = e; }
            type = 2;
        }
    await r.table('guild').get(guild.id).update({
        warnings: r.literal(storedGuild.warnings)
    });
    return {
        type,
        count: warningCount,
        error
    };
};

bu.issuePardon = async function (user, guild, count, params) {
    let storedGuild = await bu.getGuild(guild.id);
    if (count == undefined) count = 1;
    if (params == undefined) params = {};
    if (!storedGuild.warnings) storedGuild.warnings = {};
    if (!storedGuild.warnings.users) storedGuild.warnings.users = {};
    if (!storedGuild.warnings.users[user.id]) storedGuild.warnings.users[user.id] = 0;
    storedGuild.warnings.users[user.id] -= count;
    if (storedGuild.warnings.users[user.id] < 0) storedGuild.warnings.users[user.id] = 0;
    let warningCount = storedGuild.warnings.users[user.id];

    await r.table('guild').get(guild.id).update({
        warnings: r.literal(storedGuild.warnings)
    });
    return warningCount;
};

bu.comparePerms = (m, allow) => {
    if (!allow) allow = bu.defaultStaff;
    let newPerm = new Permission(allow);
    for (let key in newPerm.json) {
        if (m.permissions.has(key)) {
            return true;
        }
    }
    return false;
};

bu.splitInput = (content, noTrim) => {
    let input;
    if (Array.isArray(content)) content = content.join(' ');
    if (typeof content !== 'string') content = content.toString();
    if (!noTrim) input = content.replace(/ +/g, ' ').split(' ');
    else input = content.split(' ');
    if (input.length > 0 && input[0] == '')
        input.shift();
    if (input.length > 0 && input.slice(-1)[0] == '')
        input.pop();
    let words = [];
    let inQuote = false;
    let quoted = '';

    for (let i in input) {
        if (!inQuote) {
            if (input[i].startsWith('"') && !input[i].startsWith('\\"')) {
                inQuote = true;
                if (input[i].endsWith('"') && !input[i].endsWith('\\"')) {
                    inQuote = false;
                    words.push(input[i].substring(1, input[i].length - 1));
                } else
                    quoted = input[i].substring(1, input[i].length) + ' ';
            } else {
                words.push(input[i]);
            }
        } else if (inQuote) {
            if (input[i].endsWith('"') && !input[i].endsWith('\\"')) {
                inQuote = false;
                quoted += input[i].substring(0, input[i].length - 1);
                words.push(quoted);
            } else {
                quoted += input[i] + ' ';
            }
        }
    }
    if (inQuote) {
        words = input;
    }
    for (let i in words) {
        words[i] = words[i].replace(/\\"/g, '"');
        if (!noTrim) words[i] = words[i].replace(/^ +/g, '');
    }
    //console.debug(words);
    return words;
};

bu.canExecuteCcommand = async function (msg, commandName, quiet) {
    let val = await bu.ccommand.get(msg.guild ? msg.guild.id : '', commandName);
    if (val && typeof val == "object") {
        if (val.hidden) return false;
        let roles = val.roles;
        if (roles && roles.length > 0) {
            for (let role of roles) {
                if (await bu.hasPerm(msg, role, quiet))
                    return true;
            }
        } else return true;
    } else {
        return true;
    }
    return false;
};

bu.canExecuteCommand = async function (msg, name, quiet, options = {}) {
    if (msg.author.id == bu.CAT_ID && bu.catOverrides) return { executable: true, name };
    if (msg.channel.guild) {
        let { storedGuild, permOverride, staffPerms } = options;
        let adminrole;

        if (!storedGuild) {
            storedGuild = await bu.getGuild(msg.guild.id);
            permOverride = storedGuild.settings.permoverride;
            staffPerms = storedGuild.settings.staffperms;
            if (storedGuild.settings.adminrole !== undefined && storedGuild.settings.adminrole !== "")
                adminrole = storedGuild.settings.adminrole;
        }

        let Command = CommandManager.commandList[name], category;
        if (Command)
            category = bu.CommandType.properties[CommandManager.commandList[name].category];

        let command = storedGuild.commandperms[name];
        let commandObj = CommandManager.list[name];

        if (command && command.disabled && commandObj.cannotDisable !== true) {
            return { executable: false, name };
        }

        if (category && category.requirement) {
            if (!await category.requirement(msg, storedGuild))
                return { executable: false, name };
        }

        if (permOverride && permOverride != 0)
            if (staffPerms) {
                let allow = parseInt(staffPerms);
                if (!isNaN(allow)) {
                    if (bu.comparePerms(msg.member, allow)) {
                        return { executable: true, name };
                    }
                }
            } else {
                if (bu.comparePerms(msg.member)) {
                    return { executable: true, name };
                }
            }
        if (storedGuild) {
            if (command) {
                if (command.permission && bu.comparePerms(msg.member, command.permission)) {
                    return { executable: true, name };
                } else if (command.rolename) {
                    return { executable: await bu.hasPerm(msg, command.rolename, quiet), name };
                } else {
                    if (category.perm) {
                        if (!await bu.hasPerm(msg, adminrole || category.perm, quiet)) {
                            return { executable: false, name };
                        }
                    }
                    return { executable: true, name };
                }
            }
        }
        if (category && category.perm) {
            if (!await bu.hasPerm(msg, adminrole || category.perm, quiet)) {
                return { executable: false, name };
            }
        }
        return { executable: true, name };
    } else {
        if (category.perm) {
            if (!await bu.hasPerm(msg, category.perm, quiet)) {
                return { executable: false, name };
            }
        }
        return { executable: true, name };
    }
};

bu.shuffle = (array) => {
    let i = 0,
        j = 0,
        temp = null;

    for (i = array.length - 1; i > 0; i -= 1) {
        j = Math.floor(Math.random() * (i + 1));
        temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
};

bu.padLeft = (value, length) => {
    return (value.toString().length < length) ? bu.padLeft(' ' + value, length) : value;
};

bu.padRight = (value, length) => {
    return (value.toString().length < length) ? bu.padRight(value + ' ', length) : value;
};

bu.logEvent = async function (guildid, userids, event, fields, embed) {
    let storedGuild = await bu.getGuild(guildid);
    if (!storedGuild.hasOwnProperty('log')) storedGuild.log = {};
    if (!storedGuild.hasOwnProperty('logIgnore')) storedGuild.logIgnore = [];
    if (!Array.isArray(userids)) userids = [userids];
    // If there are not any userId's that are not contained in the ignore, then return
    // I.e. if all the users are contained in the ignore list
    if (!userids.find(id => !storedGuild.logIgnore.includes(id)))
        return;
    event = event.toLowerCase();

    let roleAdd = false;
    let roleId;
    if (event.startsWith('role:')) {
        let c = event.split(':');
        roleId = c[1];
        roleAdd = c[2] === 'add';
        event = c.slice(0, 2).join(':');
    }

    if (storedGuild.log.hasOwnProperty(event)) {
        let color;
        let eventName;
        switch (event) {
            case 'messagedelete':
                color = 0xaf1d1d;
                eventName = 'Message Deleted';
                break;
            case 'messageupdate':
                color = 0x771daf;
                eventName = 'Message Updated';
                break;
            case 'nameupdate':
                color = 0xd8af1a;
                eventName = 'Username Updated';
                break;
            case 'avatarupdate':
                color = 0xd8af1a;
                eventName = 'Avatar Updated';
                break;
            case 'nickupdate':
                color = 0xd8af1a;
                eventName = 'Nickname Updated';
                break;
            case 'memberjoin':
                color = 0x1ad8bc;
                eventName = 'User Joined';
                break;
            case 'memberleave':
                color = 0xd8761a;
                eventName = 'User Left';
                break;
            case 'memberunban':
                color = 0x17c914;
                eventName = 'User Was Unbanned';
                break;
            case 'memberban':
                color = 0xcc0c1c;
                eventName = 'User Was Banned';
                break;
            case 'kick':
                color = 0xe8b022;
                eventName = 'User Was Kicked';
            default:
                if (event.startsWith('role:')) {
                    eventName = `Special Role ${roleAdd ? 'Added' : 'Removed'}`;
                }
                break;
        }
        let channel = storedGuild.log[event];
        if (!embed) embed = {};
        embed.title = `ℹ ${eventName}`;
        embed.timestamp = moment();
        embed.fields = fields;
        embed.color = color;
        try {
            await bu.send(channel, {
                embed
            });
        } catch (err) {
            storedGuild.log[event] = undefined;
            await r.table('guild').get(guildid).replace(storedGuild);
            await bu.send(guildid, `Disabled event \`${event}\` because either output channel doesn't exist, or I don't have permission to post messages in it.\n\`\`\`${err.message}\`\`\``);
        }
    }
};

bu.getAudit = async function (guildId, targetId, type) {
    try {
        let guild = bot.guilds.get(guildId);
        let user = bot.users.get(targetId);
        let al = await bot.getGuildAuditLogs(guild.id, 50, null, type);
        for (const e of al.entries) {
            if (e.targetID === targetId) {
                return e;
            }
        }
        return null;
    } catch (err) {
        // may not have audit log perms
        return null;
    }
};

bu.getFullName = function (user) {
    return `${user.username}#${user.discriminator}`;
};

bu.filterMentions = async function (message, guild) {
    while (/<@!?[0-9]{17,21}>/.test(message)) {
        let id = message.match(/<@!?([0-9]{17,21})>/)[1];
        try {
            let user = bot.users.get(id) || await bot.getRESTUser(id);
            message = message.replace(new RegExp(`<@!?${id}>`), bu.getFullName(user));
        } catch (err) {
            message = message.replace(new RegExp(`<@!?${id}>`), `<@\u200b${id}>`);
        }
    }
    while (/<#[0-9]{17,21}>/.test(message)) {
        let id = message.match(/<#([0-9]{17,21})>/)[1];
        let channel = bot.getChannel(id);
        if (channel) {
            message = message.replace(new RegExp(`<#${id}>`), `#${channel.name}`);
        } else {
            message = message.replace(new RegExp(`<#${id}>`), `<#\u200b${id}>`);
        }
    }
    if (guild)
        while (/<@&[0-9]{17,21}>/.test(message)) {
            let id = message.match(/<@&([0-9]{17,21})>/)[1];
            let role = guild.roles.get(id);
            if (role) {
                message = message.replace(new RegExp(`<@&${id}>`), `${role.name}`);
            } else {
                message = message.replace(new RegExp(`<@&${id}>`), `<@&\u200b${id}>`);
            }
        }
    return message;
};

const timeKeywords = {
    days: ['day', 'days', 'd'],
    hours: ['hours', 'hour', 'h'],
    minutes: ['minutes', 'minute', 'min', 'mins', 'm'],
    seconds: ['seconds', 'second', 'sec', 'secs', 's']
};

bu.parseDuration = function (text) {
    let duration = moment.duration();
    if (/([0-9]+) ?(day|days|d)/i.test(text))
        duration.add(parseInt(text.match(/([0-9]+) ?(day|days|d)/i)[1]) || 0, 'd');
    if (/([0-9]+) ?(hours|hour|h)/i.test(text))
        duration.add(parseInt(text.match(/([0-9]+) ?(hours|hour|h)/i)[1]) || 0, 'h');
    if (/([0-9]+) ?(minutes|minute|mins|min|m)/i.test(text))
        duration.add(parseInt(text.match(/([0-9]+) ?(minutes|minute|mins|min|m)/i)[1]) || 0, 'm');
    if (/((?:[0-9]*[.])?[0-9]+) ?(seconds|second|secs|sec|s)/i.test(text))
        duration.add(Math.floor(parseFloat(text.match(/((?:[0-9]*[.])?[0-9]+) ?(seconds|second|secs|sec|s)/i)[1]) * 1000) || 0, 'ms');
    return duration;
};

bu.parseInput = function (map, text, noTrim) {
    let words;
    if (Array.isArray(text)) words = bu.splitInput(text.slice(1).join(' '), noTrim);
    else words = bu.splitInput(text, noTrim);
    let output = {
        undefined: []
    };
    let currentFlag = '';
    for (let i = 0; i < words.length; i++) {
        let pushFlag = true;
        if (words[i].startsWith('--')) {
            if (words[i].length > 2) {
                let flags = map.filter(f => f.word == words[i].substring(2).toLowerCase());
                if (flags.length > 0) {
                    currentFlag = flags[0].flag;
                    output[currentFlag] = [];
                    pushFlag = false;
                }
            } else {
                currentFlag = '';
                pushFlag = false;
            }
        } else if (words[i].startsWith('-')) {
            if (words[i].length > 1) {
                let tempFlag = words[i].substring(1);

                for (let char of tempFlag) {
                    currentFlag = char;
                    output[currentFlag] = [];
                }
                pushFlag = false;
            }
        } else if (words[i].startsWith('\\-')) {
            words[i] = words[i].substring(1);
        }
        if (pushFlag) {
            if (currentFlag != '') {
                output[currentFlag].push(words[i]);
            } else {
                output['undefined'].push(words[i]);
            }
        }
    }
    return output;
};

bu.getPerms = function (channelid) {
    let channel = bot.getChannel(channelid);
    if (channel) {
        let permission = channel.permissionsOf(bot.user.id);
        return permission.json;
    } else {
        return null;
    }
};

bu.request = function (options) {
    return new Promise((fulfill, reject) => {
        request(options, (err, res, body) => {
            if (err) {
                reject(err);
                return;
            }
            fulfill({
                res,
                body
            });
        });
    });
};


const tokenChoices = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890';
bu.genToken = function (length) {
    if (!length) length = 7;
    let output = '';
    for (let i = 0; i < length; i++) {
        output += tokenChoices[bu.getRandomInt(0, tokenChoices.length - 1)];
    }
    return output;
};

bu.awaitEvent = function (obj) {
    return new Promise((fulfill, reject) => {
        cluster.send(obj);
        bu.emitter.once(obj.code, fulfill);

        setTimeout(() => {
            reject('Timed out after 60 seconds');
        }, 60000);
    });
};

bu.genEventCode = function () {
    let code = bu.genToken(15);
    while (bu.emitter.listeners(code, true)) {
        code = bu.genToken(15);
    }
    return code;
};

bu.getAuthor = function (user) {
    return {
        name: bu.getFullName(user),
        url: `https://blargbot.xyz/user/${user.id}`,
        icon: user.avatarURL
    };
};

bu.isUserStaff = async function (userId, guildId) {
    if (userId == guildId) return true;
    let guild = bot.guilds.get(guildId);
    if (!guild) return false;
    let member = guild.members.get(userId);
    if (!member) return false;

    if (guild.ownerID == userId) return true;
    if (member.permissions.has('administrator')) return true;

    let storedGuild = await bu.getGuild(guildId);
    if (storedGuild && storedGuild.settings && storedGuild.settings.permoverride) {
        let allow = storedGuild.settings.staffperms || bu.defaultStaff;
        if (bu.comparePerms(bot.guilds.get(guildId).members.get(userId), allow)) {
            return true;
        }
    }
    return false;
};


bu.createRegExp = function (term) {
    if (term.length > 2000)
        throw new Error('Regex too long');
    if (/^\/?.*\/.*/.test(term)) {
        let regexList = term.match(/^\/?(.*)\/(.*)/);

        let temp = new RegExp(regexList[1], regexList[2]);
        if (!isSafeRegex(temp)) {
            throw new Error('Unsafe Regex');
        }
        return temp;
    }
    throw new Error('Invalid Regex');
};

bu.postStats = function () {
    // updateStats();
    var stats = {
        server_count: bot.guilds.size,
        shard_count: config.shards.max,
        shard_id: parseInt(process.env.CLUSTER_ID)
    };
    // bot.executeWebhook('511922345099919360', config.shards.shardToken, {
    //     content: JSON.stringify(stats)
    // });
    console.log(stats);
    request.post({
        'url': `https://discord.bots.gg/api/v1/bots/${bot.user.id}/stats`,
        'headers': {
            'content-type': 'application/json',
            'Authorization': config.general.botlisttoken,
            'User-Agent': 'blargbot/1.0 (ratismal)'
        },
        'json': true,
        body: stats
    }, (err) => {
        if (err) console.error(err);
    });

    if (!config.general.isbeta) {
        console.info('Posting to matt');

        request.post({
            'url': 'https://www.carbonitex.net/discord/data/botdata.php',
            'headers': {
                'content-type': 'application/json'
            },
            'json': true,
            body: {
                'key': config.general.carbontoken,
                'servercount': stats.server_count,
                shard_count: stats.shard_count,
                shard_id: stats.shard_id,
                'logoid': bot.user.avatar
            }
        }, (err) => {
            if (err) console.error(err);
        });

        let shards = [];
        for (const shardId of bot.shards.map(s => s.id)) {
            shards[shardId] = bot.guilds.filter(g => g.shard.id === shardId);
        }
        request.post({
            url: `https://discordbots.org/api/bots/${bot.user.id}/stats`,
            json: true,
            headers: {
                'content-type': 'application/json',
                'Authorization': config.general.botlistorgtoken,
                'User-Agent': 'blargbot/1.0 (ratismal)'
            },
            body: {
                shards
            }
        }, err => {
            if (err) console.error(err);
        });
    }
};
async function updateStats() {
    let yesterday = moment().subtract(1, 'day').format('YYYY-MM-DD');
    if (!bu.stats[yesterday]) {
        let storedStats = await r.table('vars').get('stats');
        if (!storedStats) {
            await r.table('vars').insert({
                varname: 'stats',
                stats: {}
            });
            storedStats = {
                stats: {}
            };
        }
        bu.stats[yesterday] = storedStats.stats[yesterday];
        if (!bu.stats[yesterday]) {
            bu.stats[yesterday] = {
                guilds: bot.guilds.size,
                change: 0
            };
        }
    }
    let day = moment().format('YYYY-MM-DD');
    if (!bu.stats[day]) bu.stats[day] = {};
    bu.stats[day].guilds = bot.guilds.size;
    bu.stats[day].change = bu.stats[day].guilds - bu.stats[yesterday].guilds;

    await r.table('vars').get('stats').update({
        stats: bu.stats
    });
}

bu.fixContent = (content) => {
    let tempContent = content.split('\n');
    for (let i = 0; i < tempContent.length; i++) {
        tempContent[i] = tempContent[i].trim();
    }
    return tempContent.join('\n');
};

bu.sleep = function (time) {
    return new Promise(fulfill => {
        if (!time) time = 1000;
        setTimeout(() => fulfill(), time);
    });
};

bu.escapeHTML = function (text) {
    return text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
};

bu.between = function (value, lower, upper, inclusive) {
    if (lower > upper)
        lower = [upper, upper = lower][0];

    if (inclusive)
        return value >= lower && value <= upper;
    return value > lower && value < upper;
};

bu.parseBoolean = function (value, defValue = null, includeNumbers = true) {
    if (typeof value == 'boolean')
        return value;

    if (includeNumbers && typeof value == 'number')
        return value !== 0;

    if (typeof value != 'string')
        return defValue;

    if (includeNumbers) {
        let asNum = parseFloat(value);
        if (!isNaN(asNum))
            return asNum !== 0;
    }

    switch (value.toLowerCase()) {
        case 'true':
        case 't':
        case 'yes':
        case 'y':
            return true;
        case 'false':
        case 'f':
        case 'no':
        case 'n':
            return false;
        default:
            return defValue;
    }
};

bu.isBoolean = function (value) {
    return typeof value == 'boolean';
};

bu.parseColor = function (text) {
    if (typeof text == 'number') return text;
    if (typeof text != 'string') return null;

    text = text.replace(/\s+/g, '').toLowerCase();

    let name = text.toLowerCase().replace(/[^a-z]/g, '');
    if (name == 'random')
        return bu.getRandomInt(0, 0xffffff);

    //By name
    let named = colors[name];
    if (named != null)
        return parseInt(named, 16);

    //RGB 256,256,256
    let match = text.match(/^\(?(\d{1,3}),(\d{1,3}),(\d{1,3})\)?$/);
    if (match != null) {
        let r = parseInt(match[1]),
            g = parseInt(match[2]),
            b = parseInt(match[3]),
            valid = (v => bu.between(v, 0, 255, true)),
            toHex = (v => v.toString(16).padStart(2, '0'));
        if (isNaN(r + g + b) || !valid(r) || !valid(g) || !valid(b))
            return null;
        console.debug('color: ' + toHex(r) + toHex(g) + toHex(b));
        return parseInt(toHex(r) + toHex(g) + toHex(b), 16);
    }

    //Hex code with 6 digits
    match = text.match(/^#?([0-9a-f]{6})$/i);
    if (match != null)
        return parseInt(match[1], 16);

    //Hex code with 3 digits
    match = text.match(/^#?([0-9a-f]{3})$/i);
    if (match != null)
        return parseInt(match[1].split('').map(v => v + v).join(''), 16);

    //Decimal number
    match = text.match(/^\.([0-9]{1,8})$/);
    if (match != null) {
        let value = parseInt(match[1]);
        if (bu.between(value, 0, 16777215, true))
            return value;
    }

    return null;
};

bu.parseEntityId = function (text, identifier, allowJustId = false) {
    if (typeof text != 'string') return null;

    let regex = new RegExp('\\<' + identifier + '(\\d{17,23})\\>');
    let match = text.match(regex);
    if (match != null)
        return match[1];

    if (!allowJustId) return null;
    match = text.match(/\d{17,23}/);
    if (match != null)
        return match[0];
    return null;
};

bu.parseChannel = function (text, allowJustId = false) {
    let id = bu.parseEntityId(text, '#', allowJustId);
    if (id == null) return null;
    return bot.getChannel(id);
};

bu.range = function (from, to) {
    from = Math.floor(from || 0);
    to = Math.floor(to || 0);

    if (isNaN(from) || isNaN(to)) throw new Error('Range bounds must be numbers');

    if (from > to)
        from = [to, to = from][0];

    return [...Array(to - from).keys()].map(v => v + from);
};

bu.parseEmbed = function (embedText) {
    if (embedText == null)
        return undefined;

    if (!embedText || !embedText.trim())
        return undefined;

    try {
        let parsed = JSON.parse(embedText);
        if (typeof parsed !== 'object' || Array.isArray(parsed)) return null;
        else return parsed;
    } catch (e) {
        return { fields: [{ name: 'Malformed JSON', value: embedText + '' }], malformed: true };
    }
};

const prettyTimeMagnitudes = {
    //defaults
    year: 'year', years: 'years', y: 'y',
    month: 'month', months: 'months', M: 'M',
    week: 'week', weeks: 'weeks', w: 'w',
    day: 'day', days: 'days', d: 'd',
    hour: 'hour', hours: 'hours', h: 'h',
    minute: 'minute', minutes: 'minutes', m: 'm',
    second: 'second', seconds: 'seconds', s: 's',
    millisecond: 'millisecond', milliseconds: 'milliseconds', ms: 'ms',
    quarter: 'quarter', quarters: 'quarters', q: 'Q',
    //Custom
    mins: 'minutes', min: 'minute'
};

bu.parseTime = function (text, format = undefined, fromTimezone = 'Etc/UTC', toTimezone = 'Etc/UTC') {
    let now = moment.tz(fromTimezone).tz(toTimezone);
    if (!text) return now;
    switch (text.toLowerCase()) {
        case 'now': return now;
        case 'today': return now.startOf('day');
        case 'tomorrow': return now.startOf('day').add(1, 'day');
        case 'yesterday': return now.startOf('day').add(-1, 'days');
    }

    let match = text.match(/^\s*in\s+(-?\d+(?:\.\d+)?)\s+(\S+)\s*$/i), sign = 1;
    if (match == null) match = text.match(/^\s*(-?\d+(?:\.\d+)?)\s+(\S+)\s+ago\s*$/i), sign = -1;
    if (match != null) {
        let magnitude = sign * parseFloat(match[1]),
            quantity = prettyTimeMagnitudes[match[2].toLowerCase()];
        if (quantity == null)
            return 'Invalid quantity ' + match[2];
        return now.add(magnitude, quantity);
    }

    return moment.tz(text, format, fromTimezone).tz(toTimezone);
};

bu.parseInt = function (s, radix = 10) {
    if (typeof s != 'string') return parseInt(s, radix);
    //This replaces all , or . which have a , or . after them with nothing, then the remaining , with .
    return parseInt(s.replace(/[,\.](?=.*[,\.])/g, '').replace(',', '.'), radix);
};

bu.parseFloat = function (s) {
    if (typeof s != 'string') return parseFloat(s);
    //This replaces all , or . which have a , or . after them with nothing, then the remaining , with .
    return parseFloat(s.replace(/[,\.](?=.*[,\.])/g, '').replace(',', '.'));
};

bu.findEmoji = function (text, distinct) {
    if (typeof text != 'string') return [];
    let match;
    let result = [];

    text = text.replace(/\ufe0f/g, '');

    // Find custom emotes
    let regex = /<(a?:\w+:\d{17,23})>|(\w+:\d{17,23})/gi;
    while (match = regex.exec(text)) {
        if (match[2])
            result.push(match[2]);
        else
            result.push(match[1]);
    }

    // Find twemoji defined emotes
    twemoji.replace(text, function (match) {
        result.push(match);
        return match;
    });

    if (distinct)
        result = [...new Set(result)];

    // Sort by order of appearance
    result = result.map(r => {
        return {
            value: r,
            index: text.indexOf(r)
        };
    });

    return result.sort((a, b) => a.index - b.index).map(r => r.value);
};

/**
 * @template T
 * @param {T[]} values The values to group
 * @param {function(any):string} selector The key selector
 * @returns {T[][]} The grouped values. Each element of the outer array has a `key` property.
 */
bu.groupBy = function (values, selector) {
    let groups = {};
    for (const value of values) {
        const key = selector(value);
        if (groups[key] == null) {
            groups[key] = [];
            groups[key].key = key;
        }
        groups[key].push(value);
    }

    return Object.keys(groups).map(k => groups[k]);
};

bu.compare = function (a, b) {
    a = bu.toBlocks('' + a);
    b = bu.toBlocks('' + b);

    let pairs = [];
    let max = Math.max(a.length, b.length);
    for (let i = 0; i < max; i++)
        pairs.push([a[i], b[i]]);

    let result = null;

    for (const pair of pairs) {
        //If they are already identical, no need to keep checking.
        if (pair[0] == pair[1]) continue;
        if (typeof pair[0] == 'number') result -= 1;
        if (typeof pair[1] == 'number') result += 1;
        if (result) return result; //Only one of them is a number

        if (pair[0] > pair[1]) return 1;
        if (pair[0] < pair[1]) return -1;

        //They are not equal, they are not bigger or smaller than eachother.
        //They are strings or numbers. Only NaN satisfies this condition
        if (isNaN(pair[0])) result -= 1;
        if (isNaN(pair[1])) result += 1;
        if (result) return result;

        //They are both NaN, so continue checking
    }

    //All pairs are identical
    return 0;
};

bu.toBlocks = function (text) {
    let regex = /[-+]?\d+(?:\.\d*)?(?:e\+?\d+)?/g;
    let numbers = text.match(regex) || [];
    let words = text.split(regex);

    let result = [];
    let max = Math.max(numbers.length, words.length);
    for (let i = 0; i < max; i++) {
        if (words[i] !== undefined) result.push(words[i]);
        if (numbers[i] !== undefined) result.push(parseFloat(numbers[i]));
    }
    return result;
};

bu.blargbotApi = async function (endpoint, args = {}) {
    try {
        let res = await snekfetch.post(config.blargbot_api.base + endpoint)
            .set({ Authorization: config.blargbot_api.token })
            .send(args);
        return res.body;
    } catch (err) {
        console.error(err);
        return null;
    }
};

bu.decancer = function (text) {
    text = unorm.nfkd(text);
    text = limax(text, {
        replacement: ' ',
        tone: false,
        separateNumbers: false,
        maintainCase: true,
        custom: ['.', ',', ' ', '!', '\'', '"', '?']
    });
    return text;
};

bu.findMessages = async function (channelId, count, filter, before, after) {
    let result = [];
    filter = filter || (() => true);

    while (result.length < count) {
        let batchSize = Math.min(100, count - result.length);
        let batch = await bot.getMessages(channelId, batchSize, before, after);
        result.push(...batch);

        if (batch.length != batchSize)
            break;

        before = result[result.length - 1].id;
    }

    return result.filter(filter);
};

bu.formatAuditReason = function (user, reason, ban = false) {
    let fullReason = bu.getFullName(user);
    if (reason) {
        fullReason += `: ${reason}`;
    }
    // bans use their own system and cannot be uriencoded. thanks discord!
    return !ban ? encodeURIComponent(fullReason) : fullReason;
};

/**
 * Sends lookup message to msg.channel and returns the selected item
 * @param {Message} msg - Message of author
 * @param {String} type - Type of lookup in the lookup message
 * @param {Object[]} matches - An array of Objects with properties `content` and `value`
 * @param {Object} args -
 * @returns {*} The value of the matched item, returns {null} if cancelled
 */
bu.createLookup = async function (msg, type, matches, args = {}) {
    var outputString = '';
    let lookupList = [];
    for (let i = 0; i < matches.length && i < 20; i++) {
        lookupList.push(matches[i]);
    }
    for (let i = 0; i < lookupList.length; i++) {
        outputString += `${i + 1 < 10 ? ' ' + (i + 1) : i + 1}. ${lookupList[i].content}\n`;
    }
    let moreLookup = lookupList.length < matches.length ? `...and ${matches.length - lookupList.length}more.\n` : '';
    try {
        if (args.onSendCallback) args.onSendCallback();
        let query = await bu.createQuery(msg, `Multiple ${type}s found! Please select one from the list.\`\`\`prolog` +
            `\n${outputString}${moreLookup}--------------------` +
            `\nC.cancel query\`\`\`` +
            `\n**${bu.getFullName(msg.author)}**, please type the number of the ${type} you wish to select below, or type \`c\` to cancel. This query will expire in 5 minutes.`
            ,(msg2) => {
                return msg2.content.toLowerCase() === 'c' || (parseInt(msg2.content) < lookupList.length + 1 && parseInt(msg2.content) >= 1);
            }, undefined, args.label, args.suppress);
        let response = await query.response;
        if (response.content.toLowerCase() === 'c') {
            await bot.deleteMessage(query.prompt.channel.id, query.prompt.id);
            if (!args.suppress) {
                if (args.onSendCallback) args.onSendCallback();
                await bu.send(msg, `Query canceled${args.label ? ' in ' + args.label : ''}.`);
            }
            return null;
        } else {
            await bot.deleteMessage(query.prompt.channel.id, query.prompt.id);
            return lookupList[parseInt(response.content) - 1].value;
        }
    } catch (err) {
        return null;
    }
};
