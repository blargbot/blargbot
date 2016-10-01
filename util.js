var moment = require('moment-timezone');
var Promise = require('promise');
var request = require('request');
const Eris = require('eris');
var e = module.exports = {};
e.CAT_ID = '103347843934212096';
e.catOverrides = true;

e.db = null;
e.config = null;
e.emitter = null;
e.VERSION = null;
e.startTime = null;
e.vars = null;

// A special character for tag injections
e.specialCharBegin = '\uE001';
e.specialCharDiv = '\uE002';
e.specialCharEnd = '\uE003';
e.tagDiv = '\uE004';


// A list of command modules
e.commands = {};
// A list of command names/descriptions for each alias or subcommand
e.commandList = {};
// A list of command usage for the current session
e.commandStats = {};
e.commandUses = 0;
// How many times cleverbot has been used
e.cleverbotStats = 0;
// How many messages the bot has made
e.messageStats = 0;

e.defaultStaff = Eris.Constants.Permissions.kickMembers
    + Eris.Constants.Permissions.banMembers
    + Eris.Constants.Permissions.administrator
    + Eris.Constants.Permissions.manageChannels
    + Eris.Constants.Permissions.manageGuild
    + Eris.Constants.Permissions.manageMessages;

e.tags = {};
e.tagList = {};
e.TagType = {
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

e.CommandType = {
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
            requirement: msg => msg.author.id == e.CAT_ID
        },
        3: {
            name: 'NSFW',
            requirement: () => true
        },
        4: {
            name: 'Music',
            requirement: msg => !msg.channel.guild ? false : e.config.discord.musicGuilds[msg.channel.guild.id]
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

e.init = (Tbot) => {
    e.bot = Tbot;
};

e.compareStats = (a, b) => {
    if (a.uses < b.uses)
        return -1;
    if (a.uses > b.uses)
        return 1;
    return 0;
}

/**
 * Checks if a user has a role with a specific name
 * @param msg - the message (Message)
 * @param perm - the name of the role required (String)
 * @param quiet - if true, won't output an error (Boolean)
 * @returns {boolean}
 */
e.hasPerm = (msg, perm, quiet) => {
    if ((msg.member.id === e.CAT_ID && e.catOverrides)
        || msg.channel.guild.ownerID == msg.member.id
        || msg.member.permission.administraton) {
        return true;
    }
    var roles = msg.channel.guild.roles.filter(m => m.name.toLowerCase() == perm.toLowerCase());
    for (var i = 0; i < roles.length; i++) {
        if (msg.member.roles.indexOf(roles[i].id) > -1) {
            return true;
        }
    } 
    if (!quiet)
        e.sendMessageToDiscord(msg.channel.id, `You need the role '${perm}' in order to use this command!`);
    return false;
};

/**
 * Sends a message to discord.
 * @param channelId - the channel id (String)
 * @param message - the message to send (String)
 * @param file - the file to send (Object|null)
 * @returns {Promise.<Message>}
 */
e.sendMessageToDiscord = function (channelId, message, file) {
    e.messageStats++;
    try {
        if (!file)
            return e.bot.createMessage(channelId, message).catch(err => console.log(err.stack));
        else
            return e.bot.createMessage(channelId, message, file).catch(err => console.log(err.stack));

    } catch (err) {
        console.log(err.stack);
    }
};

//Alias of sendMessageToDiscord
e.send = (channelId, message, file) => {
    return e.sendMessageToDiscord(channelId, message, file);
};

/**
 * Gets a user from a name (smartly)
 * @param msg - the message (Message)
 * @param name - the name of the user (String)
 * @param quiet - if true, won't respond with multiple users found(Boolean)
 * @returns {User|null}
 */
e.getUserFromName = (msg, name, quiet) => {
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
    if (!discrim) {
        userList = msg.channel.guild.members.filter(m => m.user.username && m.user.username == name);
        if (userList.length == 0) {
            userList = msg.channel.guild.members.filter(m => m.user.username && m.user.username.toLowerCase() == name);
        }
        if (userList.length == 0) {
            userList = msg.channel.guild.members.filter(m => m.user.username && m.user.username.startsWith(name));
        }
        if (userList.length == 0) {
            userList = msg.channel.guild.members.filter(m => m.user.username && m.user.username.toLowerCase().startsWith(name));
        }
    } else {
        userList = msg.channel.guild.members.filter(m => m.user.username && m.user.discriminator && m.user.username == name && m.user.discriminator == discrim);
        if (userList.length == 0) {
            userList = msg.channel.guild.members.filter(m => m.user.username && m.user.discriminator && m.user.username.toLowerCase() == name && m.user.discriminator == discrim);
        }
        if (userList.length == 0) {
            userList = msg.channel.guild.members.filter(m => m.user.username && m.user.discriminator && m.user.username.startsWith(name) && m.user.discriminator == discrim);
        }
        if (userList.length == 0) {
            userList = msg.channel.guild.members.filter(m => m.user.username && m.user.discriminator && m.user.username.toLowerCase().startsWith(name) && m.user.discriminator == discrim);
        }
    }
    userList.sort();

    if (userList.length == 1) {
        return userList[0].user;
    } else if (userList.length == 0) {
        if (!quiet)
            e.sendMessageToDiscord(msg.channel.id, `No users found.`);
        return null;
    } else {
        var userListString = '';
        for (var i = 0; i < userList.length; i++) {
            userListString += `- ${userList[i].user.username}#${userList[i].user.discriminator}\n`;
        }
        if (!quiet)
            e.sendMessageToDiscord(msg.channel.id, `Multiple users found!\`\`\`
${userListString}
\`\`\``);
        return null;
    }
};

/**
 * Saves the config file
 */
e.saveConfig = () => {
    e.emitter.emit('saveConfig');
};

/**
 * Reloads the user list (only for irc)
 */
e.reloadUserList = () => {
    e.emitter.emit('ircUserList');
};

/**
 * Gets a random integer within the range
 * @param min - minimum value (int)
 * @param max - maximum value (int)
 * @returns {int}
 */
e.getRandomInt = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};


e.sendFile = (channelid, message, url) => {
    var i = url.lastIndexOf('/');
    if (i != -1) {
        var filename = url.substring(i + 1, url.length);
        request({
            uri: url,
            encoding: null
        }, function (err, res, body) {
            e.bot.createMessage(channelid, message, {
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
e.createTimeDiffString = (moment1, moment2) => {

    var ms = moment1.diff(moment2);

    var diff = moment.duration(ms);
    //  console.log(diff.humanize());
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
e.getMemoryUsage = () => {
    var memory = process.memoryUsage();
    return memory.rss / 1024 / 1024;
};

e.bans = {};

e.unbans = {};

e.getPosition = (member) => {
    var roles = member.roles;
    var rolepos = 0;
    for (var i = 0; i < roles.length; i++) {
        var rolenum = member.guild.roles.get(roles[i]).position;
        rolepos = rolepos > rolenum ? rolepos : rolenum;
    }
    return rolepos;
};

e.logAction = (guild, user, mod, type, reason) => {
    console.log('type', user.username);
    e.guildSettings.get(guild.id, 'modlog').then(val => {
        if (val) {

            e.db.query(`select caseid from modlog where guildid = ? order by caseid desc limit 1`,
                [guild.id], (err, row) => {
                    if (err) {
                        console.log(err);
                        return;
                    }
                    var caseid = 0;
                    if (row[0] && row[0].caseid >= 0) {
                        caseid = row[0].caseid + 1;
                    }
                    var message = `**Case ${caseid}**
**Type:** ${type}
**User:** ${user.username}#${user.discriminator} (${user.id})
**Reason:** ${reason || `Responsible moderator, please do \`reason ${caseid}\` to set.`}
**Moderator:** ${mod ? `${mod.username}#${mod.discriminator}` : 'Unknown'}`;

                    e.sendMessageToDiscord(val, message).then(msg => {
                        e.db.query(`insert into modlog (guildid, caseid, userid, modid, type, msgid) 
                    values (?, ?, ?, ?, ?, ?)`, [guild.id, caseid, user.id, mod ? mod.id : null, type, msg.id], err => {
                                console.log(err);
                            });
                        return msg;
                    }).catch(err => {
                        console.log(err);
                    });
                });
        }
    });
};


e.comparePerms = (m, allow) => {
    if (!allow) allow = e.defaultStaff;
    let newPerm = new Eris.Permission(allow);
    for (let key in newPerm.json) {
        if (m.permission.has(key)) {
            return true;
        }
    } return false;
};

e.debug = false;

function setCharAt(str, index, chr) {
    if (index > str.length - 1) return str;
    return str.substr(0, index) + chr + str.substr(index + 1);
}

e.processTagInner = (params, i) => {
    return e.processTag(params.msg
        , params.words
        , params.args[i]
        , params.fallback
        , params.author
        , params.tagName);
};

e.processTag = (msg, words, contents, fallback, author, tagName) => {
    //   console.log('Contents:', contents);
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
                contents = setCharAt(contents, i, e.tagDiv);
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
            , args = tag.split(e.tagDiv)
            , replaceString
            , replaceObj = {
                replaceString: '',
                replaceContent: false
            };
        for (let ii = 0; ii < args.length; ii++) {
            args[ii] = args[ii].replace(/^[\s\n]+|[\s\n]+$/g, '');
        }
        if (e.tagList.hasOwnProperty(args[0].toLowerCase())) {
            replaceObj = e.tags[e.tagList[args[0].toLowerCase()].tagName].execute({
                msg: msg,
                args: args,
                fallback: fallback,
                words: words,
                author: author,
                tagName: tagName
            });
        } else {
            replaceObj.replaceString = e.tagProcessError(fallback, '`Tag doesn\'t exist`');
        }
        if (replaceObj.fallback) {
            fallback = replaceObj.fallback;
        }
        if (replaceObj == '') {
            return e.specialCharBegin + 'BREAK' + e.specialCharEnd;
        }
        else if (replaceObj.replaceContent) {
            if (replaceObj.replace == undefined) {
                contents = replaceObj.replaceString;
            } else {
                contents.replace(tagBrackets, '');
                contents = contents.replace(replaceObj.replace, replaceObj.replaceString);
            }
        } else {
            replaceString = replaceObj.replaceString;
            if (!replaceString) {
                replaceString = '';
            }
            replaceString = replaceString.toString();
            replaceString = replaceString.replace(/\}/gi, `${e.specialCharBegin}RB${e.specialCharEnd}`)
                .replace(/\{/gi, `${e.specialCharBegin}LB${e.specialCharEnd}`)
                .replace(/\;/g, `${e.specialCharBegin}SEMI${e.specialCharEnd}`);
            if (e.debug)
                console.log('Contents:', contents, '\ntagBrackets:', tagBrackets, '\nreplaceString:', replaceString);
            contents = contents.replace(tagBrackets, replaceString);
        }
        // console.log(contents.substring(coords[i][0], coords[i][1]));
    }
    return contents;
};

e.processSpecial = (contents, final) => {
    if (e.debug)
        console.log('Processing a special tag');
    contents += '';
    let eek1 = '\uE001';
    let eek2 = '\uE002';
    contents.replace(/\uE010|\uE011/g, '');
    while (contents.indexOf(e.specialCharBegin) > -1 && contents.indexOf(e.specialCharEnd) > -1 &&
        contents.indexOf(e.specialCharBegin) < contents.indexOf(e.specialCharEnd)) {
        var tagEnds = contents.indexOf(e.specialCharEnd),
            tagBegins = tagEnds == -1 ? -1 : contents.lastIndexOf(e.specialCharBegin, tagEnds),
            tagBrackets = contents.substring(tagBegins, tagEnds + 1),
            tag = contents.substring(tagBegins + 1, tagEnds),
            args = tag.split(e.specialCharDiv),
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
                    case 'break':
                    replaceString = '';
                    break;
        }
        console.log(tagBrackets, replaceString);
        if (replace)
            contents = contents.replace(tagBrackets, replaceString);
    }
    return contents.replace(/\uE010/g, e.specialCharBegin).replace(/\uE011/g, e.specialCharEnd);
};

/* SQL STUFF */

e.guildSettings = {
    set: (guildid, key, value) => {
        return new Promise((fulfill, reject) => {
            e.db.query(`insert into guildsetting (guildid, name, value) values (?, ?, ?)
            on duplicate key update value=values(value)`,
                [guildid, key, value], (err) => {
                    if (err) reject(err);
                    fulfill();
                });
        });
    },
    get: (guildid, key) => {
        return new Promise((fulfill, reject) => {
            e.db.query(`select value from guildsetting where guildid = ? and name = ?`,
                [guildid, key], (err, rows) => {
                    if (err) reject(err);
                    if (rows[0])
                        fulfill(rows[0].value);
                    else
                        fulfill(null);

                });
        });
    },
    remove: (guildid, key) => {
        return new Promise((fulfill, reject) => {
            e.db.query(`delete from guildsetting where guildid = ? and name = ?`,
                [guildid, key], (err) => {
                    if (err) reject(err);
                    fulfill();
                });
        });
    }
};
e.ccommand = {
    set: (guildid, commandname, value) => {
        return new Promise((fulfill, reject) => {
            e.db.query(`insert into ccommand (commandname, guildid, content) values (?, ?, ?)
            on duplicate key update content=values(content)`,
                [commandname, guildid, value], (err) => {
                    if (err) reject(err);
                    fulfill();
                });
        });
    },
    get: (guildid, commandname) => {
        return new Promise((fulfill, reject) => {
            e.db.query(`select content from ccommand where commandname = ? and guildid = ?`,
                [commandname, guildid], (err, rows) => {
                    if (err) reject(err);
                    if (rows[0])
                        fulfill(rows[0].content);
                    else
                        fulfill(null);
                });
        });
    },
    remove: (guildid, commandname) => {
        return new Promise((fulfill, reject) => {
            e.db.query(`delete from ccommand where commandname = ? and guildid = ?`,
                [commandname, guildid], (err, fields) => {
                    if (err) reject(err);
                    fulfill(fields);
                });
        });
    }
};

e.isNsfwChannel = (channelid) => {
    return new Promise((fulfill, reject) => {
        e.db.query(`select channelid from channel where channelid = ? and nsfw = true`, [channelid], (err, rows) => {
            if (err) reject(err);
            if (rows[0]) {
                fulfill(true);
            } else {
                fulfill(false);
            }
        });
    });
};

e.isBlacklistedChannel = (channelid) => {
    return new Promise((fulfill, reject) => {
        e.db.query(`select channelid from channel where channelid = ? and blacklisted = true`, [channelid], (err, rows) => {
            if (err) reject(err);
            if (rows[0]) {
                fulfill(true);
            } else {
                fulfill(false);
            }
        });
    });
};

e.canExecuteCommand = (msg, commandName, quiet) => {
    return new Promise((fulfill, reject) => {
        e.guildSettings.get(msg.channel.guild.id, 'permoverride').then(val => {
            e.guildSettings.get(msg.channel.guild.id, 'staffperms').then(val1 => {
                if (val && val != 0)
                    if (val1) {
                        let allow = parseInt(val1);
                        if (!isNaN(allow)) {
                            if (e.comparePerms(msg.member, allow)) {
                                fulfill([true, commandName]);
                                return;
                            }
                        }
                    } else {
                        if (e.comparePerms(msg.member)) {
                            fulfill([true, commandName]);
                            return;
                        }
                    }

                let commandQuery = `select permission, rolename
                        from commandperm where guildid = ? and commandname = ?`;
                e.db.query(commandQuery, [msg.channel.guild.id, commandName], (err, rows) => {
                    if (err) {
                        reject(err);
                    }
                    if (rows && rows[0]) {
                        if (rows[0].permission && e.comparePerms(msg.member, rows[0].permission)) {
                            fulfill([true, commandName]);
                            return;
                        } else if (rows[0].rolename && e.hasPerm(msg, rows[0].rolename, quiet)) {
                            fulfill([true, commandName]);
                            return;
                        } else if (!rows[0].rolename) {
                            if (e.CommandType.properties[e.commandList[commandName].category].perm) {
                                if (!e.hasPerm(msg, e.CommandType.properties[e.commandList[commandName].category].perm, quiet)) {
                                    fulfill([false, commandName]);
                                    return;
                                }
                            }
                            fulfill([true, commandName]);
                        }
                        fulfill([false, commandName]);
                        return;
                    } else {
                        if (e.CommandType.properties[e.commandList[commandName].category].perm) {
                            if (!e.hasPerm(msg, e.CommandType.properties[e.commandList[commandName].category].perm, quiet)) {
                                fulfill([false, commandName]);
                                return;
                            }
                        }
                        fulfill([true, commandName]);
                    }
                });
                return val1;
            }).catch(reject);
            return val;
        }).catch(reject);
    });
};

e.shuffle = (array) => {
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

e.getUser = (msg, args, index) => {
    var obtainedUser;
    if (!index) index = 1;

    msg.content = e.processSpecial(msg.content);
    if (args.length == index) {
        obtainedUser = msg.author;
    } else {
        if (args[index + 1]) {
            obtainedUser = e.getUserFromName(msg, args[index], true);
        } else {
            obtainedUser = e.getUserFromName(msg, args[index]);
        }
    }
    return obtainedUser;
};


e.tagGetFloat = (arg) => {
    return parseFloat(arg) ? parseFloat(arg) : NaN;
};

e.tagProcessError = (fallback, errormessage) => {
    return fallback == '' ? errormessage : fallback;
};