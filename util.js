var moment = require('moment-timezone');
var Promise = require('promise');
var e = module.exports = {};
e.CAT_ID = '103347843934212096';
e.catOverrides = true;

e.db = null;
e.config = null;
e.emitter = null;
e.VERSION = null;
e.startTime = null;
e.vars = null;

// A list of command modules
e.commands = {};
// A list of command names/descriptions for each alias or subcommand
e.commandList = {};

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
            requirement: msg => !msg.channel.guild ? true : e.hasPerm(msg, 'Bot Commander', true),
            perm: 'Bot Commander'
        },
        6: {
            name: 'Admin',
            requirement: msg => !msg.channel.guild ? true : e.hasPerm(msg, 'Admin', true),
            perm: 'Admin'
        }
    }
};

e.init = (Tbot) => {
    e.bot = Tbot;
};

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
    var roles = msg.channel.guild.roles.filter(m => m.name == perm);
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
    try {
        if (!file)
            return e.bot.createMessage(channelId, message).catch(err => console.log(err.stack));
        else
            return e.bot.createMessage(channelId, message, file).catch(err => console.log(err.stack));

    } catch (err) {
        console.log(err.stack);
    }
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
        return e.bot.users.get(userId);
    }
    if (/[0-9]{17,21}/.test(name)) {
        userId = name.match(/([0-9]{17,21})/)[1];
        return e.bot.users.get(userId);
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

e.logAction = (guild, user, mod, type) => {
    console.log('fuck');
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
**Reason:** Responsible moderator, please do \`reason ${caseid}\` to set.
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

e.isStaff = (m) => {
    return (m.permission.has('kickMembers')
        || m.permission.has('banMembers')
        || m.permission.has('administrator')
        || m.permission.has('manageChannels')
        || m.permission.has('manageGuild')
        || m.permission.has('manageMessages'));
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