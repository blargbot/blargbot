const moment = require('moment-timezone');
const Promise = require('promise');
const request = require('request');
const Eris = require('eris');
const emoji = require('node-emoji');
const loggerModule = require('./logger.js');
const async = require('asyncawait/async');
const await = require('asyncawait/await');

var bu = module.exports = {};

bu.CAT_ID = '103347843934212096';
bu.catOverrides = true;
bu.db = null;
bu.config = null;
bu.emitter = null;
bu.VERSION = null;
bu.startTime = null;
bu.vars = null;
var logger = bu.logger = loggerModule.init();
logger.command('meow');
//logger.level = 'debug';

// A special character for tag injections
bu.specialCharBegin = '\uE001';
bu.specialCharDiv = '\uE002';
bu.specialCharEnd = '\uE003';
bu.tagDiv = '\uE004';


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

bu.defaultStaff = Eris.Constants.Permissions.kickMembers
    + Eris.Constants.Permissions.banMembers
    + Eris.Constants.Permissions.administrator
    + Eris.Constants.Permissions.manageChannels
    + Eris.Constants.Permissions.manageGuild
    + Eris.Constants.Permissions.manageMessages;

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
}

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
            requirement: msg => !msg.channel.guild ? false : bu.config.discord.musicGuilds[msg.channel.guild.id]
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

bu.init = (Tbot) => {
    bu.bot = Tbot;
    bu.r = require('rethinkdbdash')({
        host: bu.config.db.host,
        db: bu.config.db.database,
        password: bu.config.db.password,
        user: bu.config.db.user,
        port: bu.config.db.port
    });
};

bu.compareStats = (a, b) => {
    if (a.uses < b.uses)
        return -1;
    if (a.uses > b.uses)
        return 1;
    return 0;
};

bu.awaitMessage = async((msg, message, callback) => {
    let returnMsg = await(bu.send(msg.channel.id, message));
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
            bu.emitter.on(event, async((msg2) => {
                let response;
                if (callback)
                    response = await(callback(msg2));
                else
                    response = true;
                if (response) {
                    bu.emitter.removeAllListeners(event);
                    clearTimeout(bu.awaitMessages[msg.channel.id][msg.author.id].timer);
                    fulfill(msg2);
                }
            }));
            bu.awaitMessages[msg.channel.id][msg.author.id].timer = setTimeout(() => {
                bu.emitter.removeAllListeners(event);
                bu.send(msg.channel.id, 'Query canceled after 60 seconds.');
                reject('Request timed out.');
            }, 60000);
        });
    }
    return await(registerEvent());
});

/**
 * Checks if a user has a role with a specific name
 * @param msg - the message (Message)
 * @param perm - the name of the role required (String)
 * @param quiet - if true, won't output an error (Boolean)
 * @returns {boolean}
 */
bu.hasPerm = (msg, perm, quiet) => {
    bu.logger.debug(perm);
    if ((msg.member.id === bu.CAT_ID && bu.catOverrides)
        || msg.channel.guild.ownerID == msg.member.id
        || msg.member.permission.administraton) {
        return true;
    }
    var roles = msg.channel.guild.roles.filter(m => Array.isArray(perm)
        ? perm.map(q => q.toLowerCase()).indexOf(m.name.toLowerCase()) > -1
        : m.name.toLowerCase() == perm.toLowerCase());
    for (var i = 0; i < roles.length; i++) {
        if (msg.member.roles.indexOf(roles[i].id) > -1) {
            return true;
        }
    }
    if (!quiet)
        bu.sendMessageToDiscord(msg.channel.id, `You need the role ${Array.isArray(perm) ? perm.map(m => `\`${m}\``).join(', or ') : `\`${perm}\``} in order to use this command!`);
    return false;
};

/**
 * Sends a message to discord.
 * @param channelId - the channel id (String)
 * @param message - the message to send (String)
 * @param file - the file to send (Object|null)
 * @returns {Promise.<Message>}
 */
bu.sendMessageToDiscord = function (channelId, message, file) {
    bu.messageStats++;

    try {
        message = emoji.emojify(message);
        if (!file)
            return bu.bot.createMessage(channelId, message).catch(err => logger.error(err.stack));
        else
            return bu.bot.createMessage(channelId, message, file).catch(err => logger.error(err.stack));

    } catch (err) {
        logger.error(err.stack);
    }
};

//Alias of sendMessageToDiscord
bu.send = (channelId, message, file) => {
    return bu.sendMessageToDiscord(channelId, message, file);
};

/**
 * Gets a user from a name (smartly)
 * @param msg - the message (Message)
 * @param name - the name of the user (String)
 * @param quiet - if true, won't respond with multiple users found(Boolean)
 * @returns {User|null}
 */
bu.getUserFromName = async((msg, name, quiet) => {
    var userList;
    var userId;
    var discrim;
    if (/<@!?[0-9]{17,21}>/.test(name)) {
        userId = name.match(/<@!?([0-9]{17,21})>/)[1];
        if (msg.channel.guild.members.get(userId)) {
            return msg.channel.guild.members.get(userId).user;
        }
    }
    if (/[0-9]{17,21}/.test(name)) {
        userId = name.match(/([0-9]{17,21})/)[1];
        if (msg.channel.guild.members.get(userId)) {
            return msg.channel.guild.members.get(userId).user;
        }
    }
    if (/^.*#\d{4}$/.test(name)) {
        discrim = name.match(/^.*#(\d{4}$)/)[1];
        name = name.substring(0, name.length - 5);
    }
    //userList =
    userList = msg.channel.guild.members.filter(m => (m.user.username
        && m.user.username.toLowerCase().indexOf(name.toLowerCase()) > -1
        && (discrim != undefined ? m.user.discriminator == discrim : true))
        || ((m.nick)
            && m.nick.toLowerCase().indexOf(name) > -1
            && (discrim != undefined ? m.user.discriminator == discrim : true)));

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
        if (a.user.username.toLowerCase().indexOf(name.toLowerCase()) > -1
            && a.user.username.toLowerCase().startsWith(name.toLowerCase())) {
            thingy += 10;
        }
        if (a.nick && a.nick.toLowerCase().indexOf(name.toLowerCase()) > -1
            && a.nick.toLowerCase().startsWith(name.toLowerCase())) {
            thingy += 10;
        }
        if (b.user.username.toLowerCase().indexOf(name.toLowerCase()) > -1
            && b.user.username.toLowerCase().startsWith(name.toLowerCase())) {
            thingy -= 10;
        }
        if (b.nick && b.nick.toLowerCase().indexOf(name.toLowerCase()) > -1
            && b.nick.toLowerCase().startsWith(name.toLowerCase())) {
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
    //  bu.logger.debug(userList.map(m => m.user.username));

    if (userList.length == 1) {
        return userList[0].user;
    } else if (userList.length == 0) {
        if (!quiet)
            bu.sendMessageToDiscord(msg.channel.id, `No users found.`);
        return null;
    } else {
        if (!quiet) {
            var userListString = '';
            let newUserList = [];
            for (let i = 0; i < userList.length && i < 20; i++) {
                newUserList.push(userList[i]);
            }
            for (let i = 0; i < newUserList.length; i++) {
                userListString += `${i + 1 < 10 ? ` ${i + 1}` : i + 1}. ${newUserList[i].user.username}#${newUserList[i].user.discriminator}\n`;
            }

            let resMsg = await(bu.awaitMessage(msg, `Multiple users found! Please select one from the list.\`\`\`prolog
${userListString}${newUserList.length < userList.length ? `...and ${userList.length - newUserList.length} more.\n` : ''}--------------------
 C. cancel query
\`\`\``, (msg2) => {
                    if (msg2.content.toLowerCase() == 'c' || (parseInt(msg2.content) < newUserList.length + 1 && parseInt(msg2.content) >= 1)) {
                        return true;
                    } else return false;
                }));
            if (resMsg.content.toLowerCase() == 'c') {
                bu.send(msg.channel.id, 'Query canceled.');
                return null;
            } else {
                let delmsg = bu.awaitMessages[msg.channel.id][msg.author.id].botmsg;
                await(bu.bot.deleteMessage(delmsg.channel.id, delmsg.id));
                return newUserList[parseInt(resMsg.content) - 1].user;
            }
        } else {
            return null;
        }
    }
});

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
            bu.bot.createMessage(channelid, message, {
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
    var ms = moment1.diff(moment2);
    var diff = moment.duration(ms);
    var days = diff.days();
    diff.subtract(days, 'd');
    var hours = diff.hours();
    diff.subtract(hours, 'h');
    var minutes = diff.minutes();
    diff.subtract(minutes, 'm');
    var seconds = diff.seconds();
    return `${days} days, ${hours} hours, ${minutes} minutes, and ${seconds} seconds`;
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
    var roles = member.roles;
    var rolepos = 0;
    for (var i = 0; i < roles.length; i++) {
        var rolenum = member.guild.roles.get(roles[i]).position;
        rolepos = rolepos > rolenum ? rolepos : rolenum;
    }
    return rolepos;
};

bu.logAction = async((guild, user, mod, type, reason) => {
    let isArray = Array.isArray(user);
    let val = await(bu.guildSettings.get(guild.id, 'modlog'));
    if (val) {
        let storedGuild = await(bu.r.table('guild').get(guild.id).run());
        let caseid = 0;
        if (storedGuild.modlog.length > 0) {
            caseid = storedGuild.modlog.length;
        }
        let users = isArray
            ? user.map(u => `${u.username}#${u.discriminator} (${u.id})`).join(', ')
            : `${user.username}#${user.discriminator} (${user.id})`;
        var message = `**Case ${caseid}**
**Type:** ${type}
**User:** ${users}
**Reason:** ${reason || `Responsible moderator, please do \`reason ${caseid}\` to set.`}
**Moderator:** ${mod ? `${mod.username}#${mod.discriminator}` : 'Unknown'}`;

        let msg = await(bu.sendMessageToDiscord(val, message));
        let cases = storedGuild.modlog;
        if (!Array.isArray(cases)){
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
        bu.logger
        await(bu.r.table('guild').get(guild.id).update({
            modlog: cases
        }).run());
    }
});


bu.comparePerms = (m, allow) => {
    if (!allow) allow = bu.defaultStaff;
    let newPerm = new Eris.Permission(allow);
    for (let key in newPerm.json) {
        if (m.permission.has(key)) {
            return true;
        }
    } return false;
};

bu.debug = false;

function setCharAt(str, index, chr) {
    if (index > str.length - 1) return str;
    return str.substr(0, index) + chr + str.substr(index + 1);
}

bu.processTagInner = async((params, i) => {
    return await(bu.processTag(params.msg
        , params.words
        , params.args[i]
        , params.fallback
        , params.author
        , params.tagName));
});

bu.processTag = async((msg, words, contents, fallback, author, tagName) => {
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
        let tagBrackets = subtags[i]
            , tag = tagBrackets.substring(1, tagBrackets.length - 1)
            , args = tag.split(bu.tagDiv)
            , replaceString
            , replaceObj = {
                replaceString: '',
                replaceContent: false
            };
        for (let ii = 0; ii < args.length; ii++) {
            args[ii] = args[ii].replace(/^[\s\n]+|[\s\n]+$/g, '');
        }
        if (bu.tagList.hasOwnProperty(args[0].toLowerCase())) {
            replaceObj = await(bu.tags[bu.tagList[args[0].toLowerCase()].tagName].execute({
                msg: msg,
                args: args,
                fallback: fallback,
                words: words,
                author: author,
                tagName: tagName
            }));
        } else {
            replaceObj.replaceString = bu.tagProcessError(fallback, '`Tag doesn\'t exist`');
        }
        if (replaceObj.fallback) {
            fallback = replaceObj.fallback;
        }
        if (replaceObj == '') {
            return bu.specialCharBegin + 'BREAK' + bu.specialCharEnd;
        }
        else {
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
});

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

bu.splitInput = (content) => {
    let input = content.replace(/ +/g, ' ').split(' ');
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
                let tempWords = input[i].split('\n');
                for (let ii in tempWords) {
                    if (ii != tempWords.length - 1) words.push(tempWords[ii] + '\n');
                    else words.push(tempWords[ii]);
                }
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
    }
    return words;
};

/* SQL STUFF */

bu.guildSettings = {
    set: async((guildid, key, value, type) => {
        let storedGuild = await(bu.r.table('guild').get(guildid).run());
        storedGuild.settings[key] = value;
        await(bu.r.table('guild').get(guildid).update({
            settings: storedGuild.settings
        }).run());
        return;
    }),
    get: async((guildid, key) => {
        let storedGuild = await(bu.r.table('guild').get(guildid).run());
        if (!storedGuild) return {};
        return storedGuild.settings[key];
    }),
    remove: async((guildid, key) => {
        let storedGuild = await(bu.r.table('guild').get(guildid).run());
        delete storedGuild.settings[key];
        await(bu.r.table('guild').get(guildid).replace(storedGuild).run());
        bu.logger.debug(':thonkang:');
        return;
    })
};
bu.ccommand = {
    set: async((guildid, key, value) => {
        let storedGuild = await(bu.r.table('guild').get(guildid).run());
        storedGuild.ccommands[key] = value;
        bu.r.table('guild').get(guildid).update({
            ccommands: storedGuild.ccommands
        }).run();
        return;
    }),
    get: async((guildid, key) => {
        let storedGuild = await(bu.r.table('guild').get(guildid).run());
        if (!storedGuild) return null;
        return storedGuild.ccommands[key];
    }),
    rename: async((guildid, key1, key2) => {
        let storedGuild = await(bu.r.table('guild').get(guildid).run());
        storedGuild.ccommands[key2] = storedGuild.ccommands[key1];
        delete storedGuild.ccommands[key1];
        bu.r.table('guild').get(guildid).replace(storedGuild).run();
        return;
    }),
    remove: async((guildid, key) => {
        let storedGuild = await(bu.r.table('guild').get(guildid).run());
        delete storedGuild.ccommands[key];
        bu.r.table('guild').get(guildid).replace(storedGuild).run();
        return;
    })
};

bu.isNsfwChannel = async((channelid) => {
    let guildid = bu.bot.channelGuildMap[channelid];
    if (!guildid) {
        bu.logger.warn('Couldn\'t find a guild that corresponds with channel ' + channelid + ' - isNsfwChannel');
        return false;
    }
    let guild = await(bu.r.table('guild').get(guildid).run());
    return guild.channels[channelid] ? guild.channels[channelid].nsfw : false;
});

bu.isBlacklistedChannel = async((channelid) => {
    let guildid = bu.bot.channelGuildMap[channelid];
    if (!guildid) {
        bu.logger.warn('Couldn\'t find a guild that corresponds with channel ' + channelid + ' - isBlacklistedChannel');
        return false;
    }
    let guild = await(bu.r.table('guild').get(guildid).run());
    return guild.channels[channelid] ? guild.channels[channelid].blacklisted : false;
});

bu.canExecuteCommand = async((msg, commandName, quiet) => {
    let val = await(bu.guildSettings.get(msg.channel.guild.id, 'permoverride'));
    let val1 = await(bu.guildSettings.get(msg.channel.guild.id, 'staffperms'));
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
    let storedGuild = await(bu.r.table('guild').get(msg.channel.guild.id).run());
    if (storedGuild) {
        let command = storedGuild.commandperms[commandName];
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
});

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

bu.getUser = async((msg, args, index) => {
    var obtainedUser;
    if (!index) index = 1;

    msg.content = bu.processSpecial(msg.content);
    if (args.length == index) {
        obtainedUser = msg.author;
    } else {
        if (args[index + 1]) {
            obtainedUser = await(bu.getUserFromName(msg, args[index], true));
        } else {
            obtainedUser = await(bu.getUserFromName(msg, args[index]));
        }
    }
    return obtainedUser;
});


bu.tagGetFloat = (arg) => {
    return parseFloat(arg) ? parseFloat(arg) : NaN;
};

bu.tagProcessError = async((params, fallback, errormessage) => {
    let returnMessage = '';
    if (fallback == '') returnMessage = errormessage;
    else returnMessage = await(bu.processTag(params.msg
        , params.words
        , params.fallback
        , params.fallback
        , params.author
        , params.tagName));
    return returnMessage;
});