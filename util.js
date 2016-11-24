const moment = require('moment-timezone');
const request = require('request');
const Eris = require('eris');
const emoji = require('node-emoji');
const loggerModule = require('./logger.js');



var bu = module.exports = {};

bu.CAT_ID = '103347843934212096';
bu.catOverrides = true;
bu.db = null;
bu.emitter = null;
bu.VERSION = null;
bu.startTime = null;
bu.vars = null;
loggerModule.init();
logger.command('meow');
//logger.level = 'debug';

// A special character for tag injections
bu.specialCharBegin = '\uE001';
bu.specialCharDiv = '\uE002';
bu.specialCharEnd = '\uE003';
bu.tagDiv = '\uE004';

bu.guildCache = {};

// A list of command modules
bu.commands = {};
// A list of command names/descriptions for each alias or subcommand
bu.commandList = {};
// A list of command usage for the current session
bu.commandStats = {};
bu.commandUses = 0;
// How many times cleverbot has been used
bu.cleverbotStats = 0;
// How many messages the bot has made
bu.messageStats = 0;
// A map of messages to await for
bu.awaitMessages = {};

bu.avatarColours = [
    0x2df952, 0x2df9eb, 0x2d6ef9, 0x852df9, 0xf92dd3, 0xf92d3b, 0xf9b82d, 0xa0f92d
];

bu.defaultStaff = Eris.Constants.Permissions.kickMembers +
    Eris.Constants.Permissions.banMembers +
    Eris.Constants.Permissions.administrator +
    Eris.Constants.Permissions.manageChannels +
    Eris.Constants.Permissions.manageGuild +
    Eris.Constants.Permissions.manageMessages;

bu.tags = {};
bu.tagList = {};
bu.TagType = {
    SIMPLE: 1,
    COMPLEX: 2,
    properties: {
        1: {
            name: 'Simple'
        },
        2: {
            name: 'Complex'
        }
    }
};

bu.CommandType = {
    GENERAL: 1,
    CAT: 2,
    NSFW: 3,
    MUSIC: 4,
    COMMANDER: 5,
    ADMIN: 6,
    properties: {
        1: {
            name: 'General',
            requirement: () => true
        },
        2: {
            name: 'CATZ MEOW MEOW',
            requirement: msg => msg.author.id == bu.CAT_ID
        },
        3: {
            name: 'NSFW',
            requirement: () => true
        },
        4: {
            name: 'Music',
            requirement: msg => !msg.channel.guild ? false : config.discord.musicGuilds[msg.channel.guild.id]
        },
        5: {
            name: 'Bot Commander',
            requirement: () => true,
            perm: 'Bot Commander'
        },
        6: {
            name: 'Admin',
            requirement: () => true,
            perm: 'Admin'
        }
    }
};

bu.init = () => {
    global.r = require('rethinkdbdash')({
        host: config.db.host,
        db: config.db.database,
        password: config.db.password,
        user: config.db.user,
        port: config.db.port
    });
};

bu.compareStats = (a, b) => {
    if (a.uses < b.uses)
        return -1;
    if (a.uses > b.uses)
        return 1;
    return 0;
};

bu.awaitMessage = async function(msg, message, callback, timeout) {
    let returnMsg = await bu.send(msg, message);
    if (!timeout) timeout = 300000;
    if (!bu.awaitMessages.hasOwnProperty(msg.channel.id))
        bu.awaitMessages[msg.channel.id] = {};
    let event = 'await' + msg.channel.id + '-' + msg.author.id;
    if (bu.awaitMessages[msg.channel.id][msg.author.id]) {
        clearTimeout(bu.awaitMessages[msg.channel.id][msg.author.id].timer);
    }
    bu.awaitMessages[msg.channel.id][msg.author.id] = {
        event: event,
        time: moment(msg.timestamp),
        botmsg: returnMsg
    };
    bu.emitter.removeAllListeners(event);

    function registerEvent() {
        return new Promise((fulfill, reject) => {
            bu.emitter.on(event, async function(msg2) {
                let response;
                if (callback) {
                    response = await callback(msg2);
                } else
                    response = true;
                if (response) {
                    bu.emitter.removeAllListeners(event);
                    clearTimeout(bu.awaitMessages[msg.channel.id][msg.author.id].timer);
                    fulfill(msg2);
                }
            });

            bu.awaitMessages[msg.channel.id][msg.author.id].timer = setTimeout(() => {
                bu.emitter.removeAllListeners(event);
                bu.send(msg, `Query canceled after ${moment.duration(timeout).humanize()}.`);
                reject('Request timed out.');
            }, timeout);
        });
    }
    return await registerEvent();
};

/**
 * Checks if a user has a role with a specific name
 * @param msg - the message (Message)
 * @param perm - the name of the role required (String)
 * @param quiet - if true, won't output an error (Boolean)
 * @returns {boolean}
 */
bu.hasPerm = (msg, perm, quiet) => {
    if (!msg.channel.guild) return true;
    if ((msg.member.id === bu.CAT_ID && bu.catOverrides) ||
        msg.channel.guild.ownerID == msg.member.id ||
        msg.member.permission.administraton) {
        return true;
    }
    var roles = msg.channel.guild.roles.filter(m => Array.isArray(perm) ?
        perm.map(q => q.toLowerCase()).indexOf(m.name.toLowerCase()) > -1 :
        m.name.toLowerCase() == perm.toLowerCase());
    for (var i = 0; i < roles.length; i++) {
        if (msg.member.roles.indexOf(roles[i].id) > -1) {
            return true;
        }
    }
    if (!quiet) {
        let permString = Array.isArray(perm) ? perm.map(m => '`' + m + '`').join(', or ') : '`' + perm + '`';
        bu.send(msg, `You need the role ${ permString } in order to use this command!`);
    }
    return false;
};

/**
 * Sends a message to discord.
 * @param channel - the channel id (String) or message object (Object)
 * @param message - the message to send (String)
 * @param file - the file to send (Object|null)
 * @param embed - the message embed
 * @returns {Message}
 */
bu.send = async function(channel, message, file, embed) {
    let channelid = channel;
    if (channel instanceof Eris.Message) {
        channelid = channel.channel.id;
    }
    if (!message) message = '';
    if (message.length <= 0 && !file && !embed) {
        logger.info('Tried to send a message with no content.');
        return Error('No content');
    }
    bu.messageStats++;
    let content = {};
    if (typeof message === "string") {
        content.content = message;
    } else {
        content = message;
    }
    if (!content.content) content.content = '';
    if (embed) content.embed = embed;
    content.content = emoji.emojify(content.content);

    if (content.content.length > 2000) {
        content.content = 'Oops! I tried to send a message that was too long. If you think this is a bug, please report it!';
    }
    try {
        return await bot.createMessage(channelid, content, file);
    } catch (err) {
        let warnMsg;
        let response = JSON.parse(err.response);
        switch (response.code) {
            case 50013:
                warnMsg = 'Tried sending a message, but had no permissions!';
                break;
            case 50006:
                warnMsg = 'Tried to send an empty message!';
                break;
            case 50004:
                warnMsg = 'Embeds are disabled!';
                break;
            case 50007:
                warnMsg = 'Can\'t send a message to this user!';
                break;
            case 50008:
                warnMsg = 'Can\'t send messages in a voice channel!';
                break;
            case 50001:
                warnMsg = 'Missing access!';
                break;
            default:
                logger.error(err.response, err.stack);
                throw err;
                break;
        }
        if (warnMsg) logger.warn(warnMsg, response);
        if (channel instanceof Eris.Message) {
            bu.send('250859956989853696', {
                embed: {
                    title: response.code + ' - ' + response.message,
                    color: warnMsg ? 0xe27900 : 0xAD1111,
                    description: warnMsg || err.stack,
                    timestamp: moment(channel.timestamp),
                    author: {
                        name: bu.getFullName(channel.author) + ` (${channel.author.id})`,
                        icon_url: channel.author.avatarURL
                    },
                    footer: {
                        text: `MSG: ${channel.id}`
                    },
                    fields: [{
                        name: 'Guild',
                        value: channel.guild.name + `\n${channel.guild.id}`,
                        inline: true
                    }, {
                        name: 'Channel',
                        value: channel.channel.name + `\n${channel.channel.id}`,
                        inline: true
                    }, {
                        name: 'Full Command',
                        value: channel.content,
                        inline: true
                    }, {
                        name: 'Content',
                        value: content.content
                    }]
                }
            });
        } else {
            let channel = bot.getChannel(channelid);
            bu.send('250859956989853696', {
                embed: {
                    title: response.code + ' - ' + response.message,
                    color: warnMsg ? 0xe27900 : 0xAD1111,
                    description: warnMsg || err.stack,
                    timestamp: moment(channel.timestamp),
                    fields: [{
                        name: 'Guild',
                        value: channel.guild.name + `\n${channel.guild.id}`,
                        inline: true
                    }, {
                        name: 'Channel',
                        value: channel.name + `\n${channel.id}`,
                        inline: true
                    }, {
                        name: 'Content',
                        value: content.content
                    }]
                }
            });
        }
        return null;
    }
};

/**
 * Sends a message to a DM.
 * @param user - the user id (String) or message object (Object)
 * @param message - the message to send (String)
 * @param file - the file to send (Object|null)
 * @returns {Message}
 */
bu.sendDM = async function(user, message, file) {
    let userid = user;
    if (user instanceof Eris.Message) {
        userid = user.author.id;
    }
    if (message.length >= 0) {
        logger.info('Tried to send a message with no content.');
        return Error('No content');
    }
    bu.messageStats++;
    message = emoji.emojify(message);

    if (message.length > 2000) {
        message = 'Oops! I tried to send a message that was too long. If you think this is a bug, please report it!';
    }
    try {
        let privateChannel = await bot.getDMChannel(userid);
        if (!file) return await bu.send(privateChannel.id, message);
        else return await bu.send(privateChannel.id, message, file);
    } catch (err) {
        logger.error(err.stack);
        return err;
    }
};


/**
 * Gets a user from a name (smartly)
 * @param msg - the message (Message)
 * @param name - the name of the user (String)
 * @param quiet - if true, won't respond with multiple users found(Boolean)
 * @returns {User|null}
 */
bu.getUser = async function(msg, name, quiet) {
    var userList;
    var userId;
    var discrim;
    if (/<@!?[0-9]{17,21}>/.test(name)) {
        userId = name.match(/<@!?([0-9]{17,21})>/)[1];
        if (bot.users.get(userId)) {
            return bot.users.get(userId);
        }
    }
    if (/[0-9]{17,21}/.test(name)) {
        userId = name.match(/([0-9]{17,21})/)[1];
        if (bot.users.get(userId)) {
            return bot.users.get(userId);
        }
    }
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

    userList.sort(function(a, b) {
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
    //  logger.debug(userList.map(m => m.user.username));

    if (userList.length == 1) {
        return userList[0].user;
    } else if (userList.length == 0) {
        if (!quiet)
            bu.send(msg, `No users found.`);
        return null;
    } else {
        if (!quiet) {
            var userListString = '';
            let newUserList = [];
            for (let i = 0; i < userList.length && i < 20; i++) {
                newUserList.push(userList[i]);
            }
            for (let i = 0; i < newUserList.length; i++) {
                userListString += `${i + 1 < 10 ? ' ' +  (i + 1) : i + 1}. ${newUserList[i].user.username}#${newUserList[i].user.discriminator}\n`;
            }
            let moreUserString = newUserList.length < userList.length ? `...and ${userList.length - newUserList.length}more.\n` : '';
            let resMsg = await bu.awaitMessage(msg, `Multiple users found! Please select one from the list.\`\`\`prolog
${userListString}${moreUserString}--------------------
C.cancel query
\`\`\`
**${bu.getFullName(msg.author)}**, please type the number of the user you wish to select below, or type \`c\` to cancel. This query will expire in 5 minutes.
`,
                (msg2) => {
                    if (msg2.content.toLowerCase() == 'c' || (parseInt(msg2.content) < newUserList.length + 1 && parseInt(msg2.content) >= 1)) {
                        return true;
                    } else return false;
                });
            if (resMsg.content.toLowerCase() == 'c') {
                let delmsg = bu.awaitMessages[msg.channel.id][msg.author.id].botmsg;
                await bot.deleteMessage(delmsg.channel.id, delmsg.id);
                bu.send(msg, 'Query canceled.');
                return null;
            } else {
                let delmsg = bu.awaitMessages[msg.channel.id][msg.author.id].botmsg;
                await bot.deleteMessage(delmsg.channel.id, delmsg.id);
                return newUserList[parseInt(resMsg.content) - 1].user;
            }
        } else {
            return null;
        }
    }
};

bu.getRole = async function(msg, name, quiet) {
    if (msg.channel.guild.roles.get(name)) {
        return msg.channel.guild.roles.get(name);
    }
    //userList =
    let roleList = msg.channel.guild.roles.filter(m => (m.name &&
        m.name.toLowerCase().indexOf(name.toLowerCase()) > -1));

    roleList.sort(function(a, b) {
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
    //  logger.debug(userList.map(m => m.user.username));

    if (roleList.length == 1) {
        return roleList[0];
    } else if (roleList.length == 0) {
        if (!quiet)
            bu.send(msg, `No roles found.`);
        return null;
    } else {
        if (!quiet) {
            var roleListString = '';
            let newRoleList = [];
            for (let i = 0; i < roleList.length && i < 20; i++) {
                newRoleList.push(roleList[i]);
            }
            for (let i = 0; i < newRoleList.length; i++) {
                roleListString += `${i + 1 < 10 ? ' ' + (i + 1) : i + 1}. ${newRoleList[i].name} - ${newRoleList[i].color.toString(16)} (${newRoleList[i].id})\n`;
            }
            let moreRoleString = newRoleList.length < roleList.length ? `...and ${roleList.length - newRoleList.length} more.\n` : '';
            let resMsg = await bu.awaitMessage(msg, `Multiple roles found! Please select one from the list.\`\`\`prolog
${roleListString}${moreRoleString}--------------------
C. cancel query
\`\`\`
**${bu.getFullName(msg.author)}**, please type the number of the role you wish to select below, or type \`c\` to cancel. This query will expire in 5 minutes.`, (msg2) => {
                if (msg2.content.toLowerCase() == 'c' || (parseInt(msg2.content) < newRoleList.length + 1 && parseInt(msg2.content) >= 1)) {
                    return true;
                } else return false;
            });
            if (resMsg.content.toLowerCase() == 'c') {
                bu.send(msg, 'Query canceled.');
                return null;
            } else {
                let delmsg = bu.awaitMessages[msg.channel.id][msg.author.id].botmsg;
                await bot.deleteMessage(delmsg.channel.id, delmsg.id);
                return newRoleList[parseInt(resMsg.content) - 1];
            }
        } else {
            return null;
        }
    }
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
reloadUserList = () => {
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
        }, function(err, res, body) {
            bu.send(channelid, message, {
                name: filename,
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

bu.getPosition = (member) => {;
    let role = member.guild.roles.get(member.roles.sort((a, b) => member.guild.roles.get(b).position - member.guild.roles.get(a).position)[0]);
    return role ? role.position : 0;
};

bu.logAction = async function(guild, user, mod, type, reason) {
    let isArray = Array.isArray(user);
    let val = await bu.guildSettings.get(guild.id, 'modlog');
    if (val) {
        let color = 0x17c484;
        switch (type.toLowerCase()) {
            case 'ban':
                color = 0xcc0c1c;
                break;
            case 'unban':
                color = 0x17c914;
                break;
            case 'hack-ban':
                color = 0xb90dbf;
                break;
            case 'mass hack-ban':
                color = 0x710775;
                break;
            case 'kick':
                color = 0xdb7b1c;
                break;
            case 'mute':
                color = 0xd80f66;
                break;
            case 'unmute':
                color = 0x1cdb68;
                break;
        }
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
            msgid: msg.id,
            reason: reason || null,
            type: type || 'Generic',
            userid: isArray ? user.map(u => u.id).join(',') : user.id
        });


        await r.table('guild').get(guild.id).update({
            modlog: cases
        }).run();
    }
};


bu.comparePerms = (m, allow) => {
    if (!allow) allow = bu.defaultStaff;
    let newPerm = new Eris.Permission(allow);
    for (let key in newPerm.json) {
        if (m.permission.has(key)) {
            return true;
        }
    }
    return false;
};

bu.debug = false;

function setCharAt(str, index, chr) {
    if (index > str.length - 1) return str;
    return str.substr(0, index) + chr + str.substr(index + 1);
}

bu.processTagInner = async function(params, i) {
    return await bu.processTag(params.msg, params.words, params.args[i], params.fallback, params.author, params.tagName);
};

bu.processTag = async function(msg, words, contents, fallback, author, tagName) {
    let level = 0;
    let lastIndex = 0;
    let coords = [];
    for (let i = 0; i < contents.length; i++) {
        if (contents[i] == '{') {
            if (level == 0) {
                lastIndex = i;
            }
            level++;
        } else if (contents[i] == '}') {
            level--;
            if (level == 0) {
                coords.push([lastIndex, i + 1]);
            }
        } else if (contents[i] == ';') {
            if (level == 1) {
                contents = setCharAt(contents, i, bu.tagDiv);
            }
        }
    }
    let subtags = [];
    for (let i = 0; i < coords.length; i++) {
        subtags.push(contents.substring(coords[i][0], coords[i][1]));
    }
    for (let i = 0; i < subtags.length; i++) {
        let tagBrackets = subtags[i],
            tag = tagBrackets.substring(1, tagBrackets.length - 1),
            args = tag.split(bu.tagDiv),
            replaceString, replaceObj = {
                replaceString: '',
                replaceContent: false
            };
        for (let ii = 0; ii < args.length; ii++) {
            args[ii] = args[ii].replace(/^[\s\n]+|[\s\n]+$/g, '');
        }
        if (bu.tagList.hasOwnProperty(args[0].toLowerCase())) {
            replaceObj = await bu.tags[bu.tagList[args[0].toLowerCase()].tagName].execute({
                msg: msg,
                args: args,
                fallback: fallback,
                words: words,
                author: author,
                tagName: tagName
            });
        } else {
            replaceObj.replaceString = await bu.tagProcessError({
                msg: msg,
                contents: fallback,
                fallback: fallback,
                words: words,
                author: author,
                tagName: tagName
            }, fallback, '`Tag doesn\'t exist`');
        }
        if (replaceObj.fallback) {
            fallback = replaceObj.fallback;
        }
        if (replaceObj == '') {
            return bu.specialCharBegin + 'BREAK' + bu.specialCharEnd;
        } else {
            replaceString = replaceObj.replaceString;
            if (replaceString == undefined) {
                replaceString = '';
            }
            if (replaceString == bu.specialCharBegin + 'BREAK' + bu.specialCharEnd) {
                return bu.specialCharBegin + 'BREAK' + bu.specialCharEnd;
            }
            replaceString = replaceString.toString();
            replaceString = replaceString.replace(/\}/gi, `${bu.specialCharBegin}RB${bu.specialCharEnd}`)
                .replace(/\{/gi, `${bu.specialCharBegin}LB${bu.specialCharEnd}`)
                .replace(/\;/g, `${bu.specialCharBegin}SEMI${bu.specialCharEnd}`);
            logger.debug('Contents:', contents, '\ntagBrackets:', tagBrackets, '\nreplaceString:', replaceString);
            contents = contents.replace(tagBrackets, replaceString);
            if (replaceObj.replaceContent) {
                if (replaceObj.replace == undefined) {
                    contents = replaceObj.replaceString;
                } else {
                    contents.replace(tagBrackets, '');
                    contents = contents.replace(replaceObj.replace, replaceObj.replaceString);
                }
            }
        }
    }
    return contents;
};

bu.processSpecial = (contents, final) => {
    logger.debug('Processing special tags');
    contents += '';
    contents.replace(/\uE010|\uE011/g, '');
    while (contents.indexOf(bu.specialCharBegin) > -1 && contents.indexOf(bu.specialCharEnd) > -1 &&
        contents.indexOf(bu.specialCharBegin) < contents.indexOf(bu.specialCharEnd)) {
        var tagEnds = contents.indexOf(bu.specialCharEnd),
            tagBegins = tagEnds == -1 ? -1 : contents.lastIndexOf(bu.specialCharBegin, tagEnds),
            tagBrackets = contents.substring(tagBegins, tagEnds + 1),
            tag = contents.substring(tagBegins + 1, tagEnds),
            args = tag.split(bu.specialCharDiv),
            replaceString = '',
            replace = true;

        switch (args[0].toLowerCase()) {
            case 'rb':
                if (final)
                    replaceString = '}';
                else
                    replaceString = '\uE010rb\uE011';
                break;
            case 'lb':
                if (final)
                    replaceString = '{';
                else
                    replaceString = '\uE010lb\uE011';
                break;
            case 'semi':
                if (final)
                    replaceString = ';';
                else
                    replaceString = '\uE010semi\uE011';
                break;
            case 'break':
                replaceString = '';
                break;
        }
        logger.debug(tagBrackets, replaceString);
        if (replace)
            contents = contents.replace(tagBrackets, replaceString);
    }
    return contents.replace(/\uE010/g, bu.specialCharBegin).replace(/\uE011/g, bu.specialCharEnd);
};

bu.splitInput = (content, noTrim) => {
    let input;
    if (!noTrim) input = content.replace(/ +/g, ' ').split(' ');
    else input = content.split(' ');
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
        words[i] = words[i].replace(/\\"/g, '"').replace(/^[\s]+/g, '');
    }
    logger.debug(words);
    return words;
};

/* Database Stuff */

bu.guildSettings = {
    set: async function(guildid, key, value, type) {
        let storedGuild = await bu.getGuild(guildid);

        storedGuild.settings[key] = value;


        await r.table('guild').get(guildid).update({
            settings: storedGuild.settings
        }).run();
        return;
    },
    get: async function(guildid, key) {
        let storedGuild = await bu.getGuild(guildid);

        if (!storedGuild) return {};
        return storedGuild.settings[key];
    },
    remove: async function(guildid, key) {
        let storedGuild = await bu.getGuild(guildid);

        delete storedGuild.settings[key];


        await r.table('guild').get(guildid).replace(storedGuild).run();
        logger.debug(':thonkang:');
        return;
    }
};
bu.ccommand = {
    set: async function(guildid, key, value) {
        let storedGuild = await bu.getGuild(guildid);

        storedGuild.ccommands[key] = value;

        r.table('guild').get(guildid).update({
            ccommands: storedGuild.ccommands
        }).run();
        return;
    },
    get: async function(guildid, key) {
        let storedGuild = await bu.getGuild(guildid);

        if (!storedGuild) return null;
        return storedGuild.ccommands[key];
    },
    rename: async function(guildid, key1, key2) {
        let storedGuild = await bu.getGuild(guildid);

        storedGuild.ccommands[key2] = storedGuild.ccommands[key1];
        delete storedGuild.ccommands[key1];

        r.table('guild').get(guildid).replace(storedGuild).run();
        return;
    },
    remove: async function(guildid, key) {
        let storedGuild = await bu.getGuild(guildid);

        delete storedGuild.ccommands[key];

        r.table('guild').get(guildid).replace(storedGuild).run();
        return;
    }
};

bu.isNsfwChannel = async function(channelid) {
    let guildid = bot.channelGuildMap[channelid];
    if (!guildid) {
        //   logger.warn('Couldn\'t find a guild that corresponds with channel ' + channelid + ' - isNsfwChannel');
        return true;
    }
    let guild = await bu.getGuild(guildid);

    return guild.channels[channelid] ? guild.channels[channelid].nsfw : false;
};

bu.isBlacklistedChannel = async function(channelid) {
    let guildid = bot.channelGuildMap[channelid];
    if (!guildid) {
        //logger.warn('Couldn\'t find a guild that corresponds with channel ' + channelid + ' - isBlacklistedChannel');
        return false;
    }
    let guild = await bu.getGuild(guildid);

    return guild.channels[channelid] ? guild.channels[channelid].blacklisted : false;
};


bu.getGuild = async function(guildid) {
    let storedGuild;
    if (bu.guildCache[guildid]) {
        storedGuild = bu.guildCache[guildid];
    } else {
        storedGuild = await r.table('guild').get(guildid);
        bu.guildCache[guildid] = storedGuild;
    }
    return storedGuild;
};

bu.canExecuteCommand = async function(msg, commandName, quiet) {
    if (msg.author.id == bu.CAT_ID && bu.catOverrides) return [true, commandName];
    if (msg.channel.guild) {
        let permoverride, staffperms, storedGuild;
        storedGuild = await bu.getGuild(msg.guild.id);
        let val = storedGuild.settings.permoverride,
            val1 = storedGuild.settings.staffperms;

        let command;
        if (storedGuild) {
            command = storedGuild.commandperms[commandName];
        }
        if (command && command.disabled) {
            return [false, commandName];
        }
        if (val && val != 0)
            if (val1) {
                let allow = parseInt(val1);
                if (!isNaN(allow)) {
                    if (bu.comparePerms(msg.member, allow)) {
                        return [true, commandName];
                    }
                }
            } else {
                if (bu.comparePerms(msg.member)) {
                    return [true, commandName];
                }
            }
        if (storedGuild) {
            if (command) {
                if (command.permission && bu.comparePerms(msg.member, command.permission)) {
                    return [true, commandName];
                } else if (command.rolename) {
                    if (bu.hasPerm(msg, command.rolename, quiet))
                        return [true, commandName];
                    else return [false, commandName];
                } else if (!command.rolename) {
                    if (bu.CommandType.properties[bu.commandList[commandName].category].perm) {
                        if (!bu.hasPerm(msg, bu.CommandType.properties[bu.commandList[commandName].category].perm, quiet)) {
                            return [false, commandName, 1];
                        }
                    }
                    return [true, commandName];
                }
            }
        }
        if (bu.CommandType.properties[bu.commandList[commandName].category].perm) {
            if (!bu.hasPerm(msg, bu.CommandType.properties[bu.commandList[commandName].category].perm, quiet)) {
                return [false, commandName, 3];
            }
        }
        return [true, commandName];
    } else {
        if (bu.CommandType.properties[bu.commandList[commandName].category].perm) {
            if (!bu.hasPerm(msg, bu.CommandType.properties[bu.commandList[commandName].category].perm, quiet)) {
                return [false, commandName, 3];
            }
        }
        return [true, commandName];
    }
};

bu.shuffle = (array) => {
    let counter = array.length;

    // While there are elements in the array
    while (counter > 0) {
        // Pick a random index
        let index = Math.floor(Math.random() * counter);

        // Decrease counter by 1
        counter--;

        // And swap the last element with it
        let temp = array[counter];
        array[counter] = array[index];
        array[index] = temp;
    }

    return array;
};

bu.getTagUser = async function(msg, args, index) {
    var obtainedUser;
    if (!index) index = 1;

    msg.content = bu.processSpecial(msg.content);
    if (args.length == index) {
        obtainedUser = msg.author;
    } else {
        if (args[index + 1]) {
            obtainedUser = await bu.getUser(msg, args[index], true);
        } else {
            obtainedUser = await bu.getUser(msg, args[index]);
        }
    }
    return obtainedUser;
};


bu.tagGetFloat = (arg) => {
    return parseFloat(arg) ? parseFloat(arg) : NaN;
};

bu.tagProcessError = async function(params, fallback, errormessage) {
    let returnMessage = '';
    if (fallback == '') returnMessage = errormessage;
    else returnMessage = await bu.processTag(params.msg, params.words, params.fallback, params.fallback, params.author, params.tagName);
    return returnMessage;
};


bu.fixContent = (content) => {
    let tempContent = content.split('\n');
    for (let i = 0; i < tempContent.length; i++) {
        tempContent[i] = tempContent[i].trim();
    }
    return tempContent.join('\n');
};


bu.padLeft = (value, length) => {
    return (value.toString().length < length) ? bu.padLeft(' ' + value, length) : value;
};

bu.padRight = (value, length) => {
    return (value.toString().length < length) ? bu.padRight(value + ' ', length) : value;
};

bu.logEvent = async function(guildid, event, message) {
    let storedGuild = await bu.getGuild(guildid);
    if (!storedGuild.hasOwnProperty('log'))
        storedGuild.log = {};
    if (storedGuild.log.hasOwnProperty(event)) {
        let channel = storedGuild.log[event];
        bu.send(channel, `:information_source: **[${moment().tz('UTC').format('YY/MM/DD hh:mm:ss zz')}]** **Event: __${event}__**
${message}`);
    }
};

bu.getFullName = function(user) {
    return `${user.username}#${user.discriminator}`;
};

bu.sendPornLog = function(msg, type, tagList, nsfwChannel, color) {
    bu.send('230801689551175681', {
        embed: {
            title: type,
            color: color || 0xc9cfd8,
            description: tagList.join(' '),
            fields: [{
                name: msg.guild.name,
                value: msg.guild.id,
                inline: true
            }, {
                name: msg.channel.name,
                value: msg.channel.id,
                inline: true
            }, {
                name: 'NSFW',
                value: nsfwChannel || false,
                inline: true
            }],
            author: {
                name: `${bu.getFullName(msg.author)} (${msg.author.id})`,
                icon_url: msg.author.avatarURL
            },
            timestamp: moment(msg.timestamp),
            footer: {
                text: `MsgID: ${msg.id}`
            }
        }
    });
};

bu.filterMentions = async function(message) {
    while (/<@!?[0-9]{17,21}>/.test(message)) {
        let id = message.match(/<@!?([0-9]{17,21})>/)[1];
        try {
            let user = bot.users.get(id) || await bot.getRESTUser(id);
            message = message.replace(new RegExp(`<@!?${id}>`), bu.getFullName(user));
        } catch (err) {
            message = message.replace(new RegExp(`<@!?${id}>`), `<@\u200b${id}>`);
        }
    }
    return message;
};