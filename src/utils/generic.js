/*
 * @Author: stupid cat
 * @Date: 2017-05-07 19:22:33
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-06-05 13:48:02
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const colors = require('../../res/colors') || {},
    snekfetch = require('snekfetch'),
    unorm = require('unorm'),
    limax = require('limax'),
    User = require('eris/lib/structures/User'),
    emojiRegex = `👁|${require('emoji-regex')().source}|<a?:\\w+:\\d{17,23}>`;

bu.compareStats = (a, b) => {
    if (a.uses < b.uses)
        return -1;
    if (a.uses > b.uses)
        return 1;
    return 0;
};

bu.awaitMessage = async function (msg, message, callback, timeout, label, suppress) {
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
        time: dep.moment(msg.timestamp),
        botmsg: returnMsg
    };
    bu.emitter.removeAllListeners(event);

    function registerEvent() {
        return new Promise((fulfill, reject) => {
            bu.emitter.on(event, async function (msg2) {
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
                if (!suppress)
                    bu.send(msg, `Query canceled${label ? ' in ' + label : ''} after ${dep.moment.duration(timeout).humanize()}.`);
                reject('Request timed out.');
            }, timeout);
        });
    }
    return await registerEvent();
};


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
    if (msg instanceof dep.Eris.Member) {
        member = msg;
    } else {
        if (!msg.channel.guild) return true;
        member = msg.member;
    }
    if (override && ((member.id === bu.CAT_ID && bu.catOverrides) ||
        member.guild.ownerID == member.id ||
        member.permission.json.administrator)) {
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
            Array.isArray(role) ?
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
    if (msg instanceof dep.Eris.Member) {
        member = msg;
    } else {
        if (!msg.channel.guild) return true;
        if (!msg.member) return false;
        member = msg.member;
    }

    if (override && ((member.id === bu.CAT_ID && bu.catOverrides) ||
        member.guild.ownerID == msg.member.id ||
        member.permission.json.administrator)) {
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

bu.addReactions = async function addReactions(channelId, messageId, reactions) {
    let errored = [];
    for (const reaction of new Set(reactions || [])) {
        try {
            await bot.addMessageReaction(channelId, messageId, reaction);
        } catch (e) {
            if (e.message == 'Unknown Emoji')
                errored.push(reaction);
            else
                throw e;
        }
    }

    return errored;
};

/**
 * Sends a message to discord.
 * @param channel - the channel id (String) or message object (Object)
 * @param message - the message to send (String)
 * @param file - the file to send (Object|null)
 * @param embed - the message embed
 * @returns {Message}
 */
bu.send = async function (channel, message, file, embed) {
    let channelid, toSend, nsfw;
    if (typeof message === "string" || !message) {
        toSend = { content: message || '', embed };
    } else {
        toSend = message;
        if (embed)
            toSend.embed = embed;
        nsfw = message.nsfw;
    }

    if (typeof channel == 'object' &&
        'channel' in channel) {
        // Channel is actually a Message object
        channelid = channel.channel.id;
    }

    if (typeof channel == "string") { // channel id
        channelid = channel;
        if (nsfw) {
            channel = await bot.getChannel(channelid);
            if (!channel || !channel.nsfw) {
                toSend = { content: nsfw };
            }
        }
    } else if (typeof channel === "object") {
        if (channel.channel) { // message object
            channel = channel.channel;
        }

        channelid = channel.id;
        if (nsfw && !channel.nsfw) {
            toSend = { content: nsfw };
        }

    }

    bu.messageStats++;

    if (!toSend.content) toSend.content = '';
    toSend.content = toSend.content.trim();

    if (toSend.content.length == 0 && !file && !toSend.embed) {
        console.info('Tried to send a message with no content.');
        return new Error('No content');
    }

    if (toSend.content.length > 2000) {
        if (!file) file = {
            file: Buffer.from(toSend.content.toString()),
            name: 'output.txt'
        };
        toSend.content = 'Oops! I tried to send a message that was too long. If you think this is a bug, please report it!';

    }

    try {
        console.debug('Sending content: ', JSON.stringify(toSend));
        return await bot.createMessage(channelid, toSend, file);
    } catch (err) {
        try {
            let response;
            if (err.response)
                response = JSON.parse(err.response);
            else {
                response = {};
            }
            let dmMsg, warnMsg;
            switch (response.code) {
                case 10003:
                    warnMsg = 'Channel not found';
                    break;
                case 50013:
                    warnMsg = 'Tried sending a message, but had no permissions!';
                    dmMsg = 'I tried to send a message in response to your command, ' +
                        'but didn\'t have permission to speak. If you think this is an error, ' +
                        'please contact the staff on your guild to give me the `Send Messages` permission.';

                    break;
                case 50006:
                    warnMsg = 'Tried to send an empty message!';
                    break;
                case 50004:
                    warnMsg = 'Tried embeding a link, but had no permissions!';

                    dmMsg = 'I tried to send a message in response to your command, ' +
                        'but didn\'t have permission to create embeds. If you think this is an error, ' +
                        'please contact the staff on your guild to give me the `Embed Links` permission.';
                    bu.send(channelid, `I don't have permission to embed links! This will break several of my commands. Please give me the \`Embed Links\` permission. Thanks!`);
                    break;
                case 50007:
                    warnMsg = 'Can\'t send a message to this user!';
                    break;
                case 50008:
                    warnMsg = 'Can\'t send messages in a voice channel!';
                    break;
                case 50001:
                    warnMsg = 'Missing access!';

                    dmMsg = 'I tried to send a message in response to your command, ' +
                        'but didn\'t have permission to see the channel. If you think this is an error, ' +
                        'please contact the staff on your guild to give me the `Read Messages` permission.';
                    break;
                default:
                    console.error(err.response, err.stack);
                    throw err;
            }
            if (typeof channel == 'string') {
                throw {
                    message: warnMsg,
                    throwOriginal: true
                };
            }
            if (dmMsg && channel.author) {
                let storedUser = await r.table('user').get(channel.author.id);
                if (!storedUser.dontdmerrors) {
                    bu.sendDM(channel.author.id, dmMsg + '\nGuild: ' + channel.guild.name + '\nChannel: ' + channel.channel.name + '\nCommand: ' + channel.content + '\n\nIf you wish to stop seeing these messages, do the command `dmerrors`.');
                }
            }
        } catch (err2) {
            // no-op
        }
    }
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
    if (user instanceof dep.Eris.Message) {
        userid = user.author.id;
    }
    if (message.length == 0) {
        console.info('Tried to send a message with no content.');
        return Error('No content');
    }
    bu.messageStats++;
    message = dep.emoji.emojify(message);

    if (message.length > 2000) {
        message = 'Oops! I tried to send a message that was too long. If you think this is a bug, please report it!';
    }
    try {
        let privateChannel = await bot.getDMChannel(userid);
        if (!file) return await bu.send(privateChannel.id, message);
        else return await bu.send(privateChannel.id, message, file);
    } catch (err) {
        console.error(err.stack);
        return err;
    }
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

    if (/[0-9]{17,21}/.test(name)) {
        userId = name.match(/(\d{17,21})/)[1];
        if (bot.users.get(userId)) {
            return bot.users.get(userId);
        } else {
            let user = await bot.sender.awaitMessage({ message: 'retrieveUser', id: userId });
            if (user.user) {
                user = new User(user.user, bot);
                return user;
            }
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
        if (!args.quiet && !args.suppress)
            bu.send(msg, `No users found${args.label ? ' in ' + args.label : ''}.`);
        return null;
    } else {
        if (!args.quiet) {
            var userListString = '';
            let newUserList = [];
            for (let i = 0; i < userList.length && i < 20; i++) {
                newUserList.push(userList[i]);
            }
            for (let i = 0; i < newUserList.length; i++) {
                userListString += `${i + 1 < 10 ? ' ' + (i + 1) : i + 1}. ${newUserList[i].user.username}#${newUserList[i].user.discriminator}\n`;
            }
            let moreUserString = newUserList.length < userList.length ? `...and ${userList.length - newUserList.length}more.\n` : '';
            try {
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
                    }, undefined, args.label, args.suppress);
                if (resMsg.content.toLowerCase() == 'c') {
                    let delmsg = bu.awaitMessages[msg.channel.id][msg.author.id].botmsg;
                    await bot.deleteMessage(delmsg.channel.id, delmsg.id);
                    if (!args.suppress)
                        bu.send(msg, `Query canceled${args.label ? ' in ' + args.label : ''}.`);
                    return null;
                } else {
                    let delmsg = bu.awaitMessages[msg.channel.id][msg.author.id].botmsg;
                    await bot.deleteMessage(delmsg.channel.id, delmsg.id);
                    return newUserList[parseInt(resMsg.content) - 1].user;
                }
            } catch (err) {
                return null;
            }
        } else {
            return null;
        }
    }
};

bu.getRole = async function (msg, name, args = {}) {
    if (typeof args !== 'object')
        args = { quiet: args };
    if (msg.channel.guild.roles.get(name)) {
        return msg.channel.guild.roles.get(name);
    }
    //userList =
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
                }, undefined, args.label, args.suppress);
            if (resMsg.content.toLowerCase() == 'c') {
                if (!args.suppress)
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
        dep.request({
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
    var diff = dep.moment.duration(moment1.diff(moment2));
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
    if (val) {
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
            timestamp: dep.moment()
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
    storedGuild.warnings.users[user.id] += count;
    if (storedGuild.warnings.users[user.id] < 0) storedGuild.warnings.users[user.id] = 0;
    let warningCount = storedGuild.warnings.users[user.id];
    if (bu.isBotHigher(guild.members.get(user.id)))
        if (storedGuild.settings.banat && storedGuild.settings.banat > 0 && warningCount >= storedGuild.settings.banat) {
            if (!bu.bans[guild.id])
                bu.bans[guild.id] = {};
            bu.bans[guild.id][user.id] = {
                mod: bot.user,
                type: 'Auto-Ban',
                reason: `Exceeded Warning Limit (${warningCount}/${storedGuild.settings.banat})`
            };
            await guild.banMember(user.id);
            storedGuild.warnings.users[user.id] = undefined;
            type = 1;
        } else if (storedGuild.settings.kickat && storedGuild.settings.kickat > 0 && warningCount >= storedGuild.settings.kickat) {
            await bu.logAction(guild, user, bot.user, 'Auto-Kick', `Exceeded Warning Limit (${warningCount}/${storedGuild.settings.kickat})`, bu.ModLogColour.KICK);
            await guild.kickMember(user.id);
            type = 2;
        }
    await r.table('guild').get(guild.id).update({
        warnings: r.literal(storedGuild.warnings)
    });
    return {
        type,
        count: warningCount
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
    let newPerm = new dep.Eris.Permission(allow);
    for (let key in newPerm.json) {
        if (m.permission.has(key)) {
            return true;
        }
    }
    return false;
};

bu.splitInput = (content, noTrim) => {
    let input;
    if (Array.isArray(content)) content = content.join(' ');
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

bu.canExecuteCommand = async function (msg, commandName, quiet) {
    if (msg.author.id == bu.CAT_ID && bu.catOverrides) return [true, commandName];
    if (msg.channel.guild) {
        let permoverride, staffperms, storedGuild, adminrole;
        storedGuild = await bu.getGuild(msg.guild.id);
        let val = storedGuild.settings.permoverride,
            val1 = storedGuild.settings.staffperms;
        //console.debug(storedGuild.settings.adminrole);

        let command = storedGuild.commandperms[commandName];
        let commandObj = CommandManager.list[commandName];
        if (storedGuild.settings.adminrole !== undefined && storedGuild.settings.adminrole !== "")
            adminrole = storedGuild.settings.adminrole;
        if (command && command.disabled && commandObj.cannotDisable !== true) {
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
                    if (await bu.hasPerm(msg, command.rolename, quiet))
                        return [true, commandName];
                    else return [false, commandName];
                } else if (!command.rolename) {
                    if (bu.CommandType.properties[CommandManager.commandList[commandName].category].perm) {
                        if (!await bu.hasPerm(msg, adminrole || bu.CommandType.properties[CommandManager.commandList[commandName].category].perm, quiet)) {
                            return [false, commandName, 1];
                        }
                    }
                    return [true, commandName];
                }
            }
        }
        if (CommandManager.commandList[commandName] && bu.CommandType.properties[CommandManager.commandList[commandName].category].perm) {
            if (!await bu.hasPerm(msg, adminrole || bu.CommandType.properties[CommandManager.commandList[commandName].category].perm, quiet)) {
                return [false, commandName, 3];
            }
        }
        return [true, commandName];
    } else {
        if (bu.CommandType.properties[CommandManager.commandList[commandName].category].perm) {
            if (!await bu.hasPerm(msg, bu.CommandType.properties[CommandManager.commandList[commandName].category].perm, quiet)) {
                return [false, commandName, 3];
            }
        }
        return [true, commandName];
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

bu.logEvent = async function (guildid, event, fields, embed) {
    let storedGuild = await bu.getGuild(guildid);
    if (!storedGuild.hasOwnProperty('log'))
        storedGuild.log = {};
    if (storedGuild.log.hasOwnProperty(event)) {
        let color;
        let eventName;
        switch (event.toLowerCase()) {
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
        }
        let channel = storedGuild.log[event];
        if (!embed) embed = {};
        embed.title = `:information_source: ${eventName}`;
        embed.timestamp = dep.moment();
        embed.fields = fields;
        embed.color = color;
        try {
            await bu.send(channel, {
                embed
            });
        } catch (err) {
            storedGuild.log[event] = undefined;
            await r.table('guild').get(guildid).replace(storedGuild);
            await bu.send(guildid, `Disabled event \`${event}\` because either output channel doesn't exist, or I don't have permission to post messages in it.`);
        }
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
    let duration = dep.moment.duration();
    if (/([0-9]+) ?(day|days|d)/i.test(text))
        duration.add(parseInt(text.match(/([0-9]+) ?(day|days|d)/i)[1]) || 0, 'd');
    if (/([0-9]+) ?(hours|hour|h)/i.test(text))
        duration.add(parseInt(text.match(/([0-9]+) ?(hours|hour|h)/i)[1]) || 0, 'h');
    if (/([0-9]+) ?(minutes|minute|mins|min|m)/i.test(text))
        duration.add(parseInt(text.match(/([0-9]+) ?(minutes|minute|mins|min|m)/i)[1]) || 0, 'm');
    if (/([0-9]+) ?(seconds|second|secs|sec|s)/i.test(text))
        duration.add(parseInt(text.match(/([0-9]+) ?(seconds|second|secs|sec|s)/i)[1]) || 0, 's');
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
        dep.request(options, (err, res, body) => {
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
    if (member.permission.has('administrator')) return true;

    let storedGuild = await bu.getGuild(guildId);
    if (storedGuild && storedGuild.settings && storedGuild.settings.permoverride) {
        let allow = storedGuild.settings.staffperms || bu.defaultStaff;
        if (bu.comparePerms(bot.guilds.get(guildId).members.get(userId), allow)) {
            return true;
        }
    }
    return false;
};

bu.makeSnowflake = function (date = Date.now()) {
    return dep.BigNumber(date).minus(1420070400000).multiply(4194304).toString();
};

bu.unmakeSnowflake = function (snowflake) {
    return (snowflake / 4194304) + 1420070400000;
};

bu.createRegExp = function (term) {
    if (/^\/?.*\/.*/.test(term)) {
        let regexList = term.match(/^\/?(.*)\/(.*)/);

        if (regexList[1].match(/\(.*[*+].*\)[+*]/))
            throw new Error('Unsafe Regex');

        let temp = new RegExp(regexList[1], regexList[2]);
        if (!dep.safe(temp)) {
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
        shard_count: config.discord.shards,
        shard_id: process.env.SHARD_ID
    };
    dep.request.post({
        'url': `https://bots.discord.pw/api/bots/${bot.user.id}/stats`,
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

        dep.request.post({
            'url': 'https://www.carbonitex.net/discord/data/botdata.php',
            'headers': {
                'content-type': 'application/json'
            },
            'json': true,
            body: {
                'key': config.general.carbontoken,
                'servercount': bot.guilds.size,
                shard_count: stats.shard_count,
                shard_id: stats.shard_id,
                'logoid': bot.user.avatar
            }
        }, (err) => {
            if (err) console.error(err);
        });

        dep.request.post({
            url: `https://discordbots.org/api/bots/${bot.user.id}/stats`,
            json: true,
            headers: {
                'content-type': 'application/json',
                'Authorization': config.general.botlistorgtoken,
                'User-Agent': 'blargbot/1.0 (ratismal)'
            },
            body: stats
        });
    }
};
async function updateStats() {
    let yesterday = dep.moment().subtract(1, 'day').format('YYYY-MM-DD');
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
    let day = dep.moment().format('YYYY-MM-DD');
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
        return JSON.parse(embedText);
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

bu.parseTime = function (text, format = undefined, timezone = 'Etc/UTC') {
    let now = dep.moment.tz(timezone);
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

    return dep.moment.tz(text, format, timezone).utcOffset(0);
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

    let regex = new RegExp(emojiRegex, "gi");
    while (match = regex.exec(text))
        result.push(match[0].replace(/[<>]/g, ''));

    if (distinct)
        result = [...new Set(result)];

    return result;
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