const cleverbot = new dep.Cleverbot();

bot.on('messageCreate', async function(msg) {
    processUser(msg);
    let isDm = msg.channel.guild == undefined;
    let storedGuild;
    if (!isDm) storedGuild = await bu.getGuild(msg.guild.id);
    if (storedGuild && storedGuild.settings.makelogs)
        bu.insertChatlog(msg, 0);

    if (msg.author.id == bot.user.id) handleOurMessage(msg);

    if (msg.member && msg.channel.id === config.discord.channel)
        handleIRCMessage(msg);

    if (msg.author.id !== bot.user.id) handleUserMessage(msg, storedGuild);

});

async function handleUserMessage(msg, storedGuild) {
    let prefix;
    if (msg.guild) {
        handleAntiMention(msg, storedGuild);
        handleCensor(msg, storedGuild);
        handleRoleme(msg, storedGuild);
        prefix = storedGuild.settings.prefix;
    } else prefix = '';

    if (msg.content.toLowerCase().startsWith('blargbot')) {
        var index = msg.content.toLowerCase().indexOf('t');
        prefix = msg.content.substring(0, index + 1);
    } else if (msg.content.toLowerCase().startsWith(config.discord.defaultPrefix)) {
        prefix = config.discord.defaultPrefix;
    }

    if (!handleBlacklist(msg, storedGuild)) return;

    var doCleverbot = false;
    if (msg.content.startsWith(`<@${bot.user.id}>`) || msg.content.startsWith(`<@!${bot.user.id}>`)) {
        prefix = msg.content.match(/<@!?[0-9]{17,21}>/)[0];
        logger.debug('Was a mention');
        doCleverbot = true;
    }
    if (msg.content.startsWith(prefix)) {
        var command = msg.content.replace(prefix, '').trim();
        logger.command('Incoming Command:', `${prefix} ${command}`);
        try {
            let wasCommand = await handleDiscordCommand(msg.channel, msg.author, command, msg);
            logger.command('Was command:', wasCommand);
            if (wasCommand) {
                logCommand(msg);

                if (msg.guild) {
                    handleDeleteNotif(msg, storedGuild);
                    if (msg.channel.guild) {
                        r.table('user').get(msg.author.id).update({
                            lastcommand: msg.cleanContent,
                            lastcommanddate: r.epochTime(dep.moment() / 1000)
                        }).run();
                    }
                }
            } else {
                if (doCleverbot && !msg.author.bot) {
                    handleCleverbot(msg);
                } else {
                    handleAwaitMessage(msg);
                }
            }
        } catch (err) {
            logger.error(err.stack);
        }
    } else {
        handleAwaitMessage(msg);
    }
}

/**
 * Processes a user into the database
 * @param msg - message (Message)
 */
var processUser = async function(msg) {
    let storedUser = await r.table('user').get(msg.author.id).run();
    if (!storedUser) {
        logger.debug(`inserting user ${msg.author.id} (${msg.author.username})`);
        r.table('user').insert({
            userid: msg.author.id,
            username: msg.author.username,
            usernames: [{
                name: msg.author.username,
                date: r.epochTime(dep.moment() / 1000)
            }],
            isbot: msg.author.bot,
            lastspoke: r.epochTime(dep.moment() / 1000),
            lastcommand: null,
            lastcommanddate: null,
            messagecount: 1,
            discriminator: msg.author.discriminator,
            todo: []
        }).run();
    } else {
        let newUser = {
            lastspoke: r.epochTime(dep.moment() / 1000),
            lastchannel: msg.channel.id,
            messagecount: storedUser.messagecount + 1
        };
        if (storedUser.username != msg.author.username) {
            newUser.username = msg.author.username;
            newUser.usernames = storedUser.usernames;
            newUser.usernames.push({
                name: msg.author.username,
                date: r.epochTime(dep.moment() / 1000)
            });
        }
        if (storedUser.discriminator != msg.author.discriminator) {
            newUser.discriminator = msg.author.discriminator;
        }
        if (storedUser.avatarURL != msg.author.avatarURL) {
            newUser.avatarURL = msg.author.avatarURL;
        }
        r.table('user').get(msg.author.id).update(newUser).run();
    }
};

/**
 * Sends a message to irc
 * @param msg - the message to send (String)
 */
function sendMessageToIrc(msg) {
    bu.emitter.emit('ircMessage', msg);
}

var tables = {
    flip: {
        prod: [
            'Whoops! Let me get that for you ┬──┬﻿ ¯\\\\_(ツ)',
            '(ヘ･_･)ヘ┳━┳ What are you, an animal?',
            'Can you not? ヘ(´° □°)ヘ┳━┳',
            'Tables are not meant to be flipped ┬──┬ ノ( ゜-゜ノ)',
            '(ﾉ´･ω･)ﾉ ﾐ ┸━┸ Wheee!',
            '┻━┻ ︵ヽ(`Д´)ﾉ︵﻿ ┻━┻ Get these tables out of my face!',
            '┻━┻ミ＼(≧ﾛ≦＼) Hey, catch!',
            'Flipping tables with elegance! (/¯◡ ‿ ◡)/¯ ~ ┻━┻'
        ]
    },
    unflip: {
        prod: [
            '┬──┬﻿ ¯\\\\_(ツ) A table unflipped is a table saved!',
            '┣ﾍ(≧∇≦ﾍ)… (≧∇≦)/┳━┳ Unflip that table!',
            'Yay! Cleaning up! ┣ﾍ(^▽^ﾍ)Ξ(ﾟ▽ﾟ*)ﾉ┳━┳',
            'ヘ(´° □°)ヘ┳━┳ Was that so hard?',
            '(ﾉ´･ω･)ﾉ ﾐ ┸━┸ Here comes the entropy!',
            'I\'m sorry, did you just pick that up? ༼ﾉຈل͜ຈ༽ﾉ︵┻━┻',
            'Get back on the ground! (╯ರ ~ ರ）╯︵ ┻━┻',
            'No need to be so serious! (ﾉ≧∇≦)ﾉ ﾐ ┸━┸'
        ]
    }
};

var flipTables = async function(msg, unflip) {
    let tableflip = await bu.guildSettings.get(msg.channel.guild.id, 'tableflip');
    if (tableflip && tableflip != 0) {
        var seed = bu.getRandomInt(0, 3);
        bu.send(msg,
            tables[unflip ? 'unflip' : 'flip'].prod[seed]);
    }
};

var handleDiscordCommand = async function(channel, user, text, msg) {
    let words = bu.splitInput(text);
    if (msg.channel.guild)
        logger.command(`Command '${text}' executed by ${user.username} (${user.id}) on server ${msg.channel.guild.name} (${msg.channel.guild.id}) on channel ${msg.channel.name} (${msg.channel.id}) Message ID: ${msg.id}`);
    else
        logger.command(`Command '${text}' executed by ${user.username} (${user.id}) in a PM (${msg.channel.id}) Message ID: ${msg.id}`);

    if (msg.author.bot) {
        return false;
    }
    let val = await bu.ccommand.get(msg.channel.guild ? msg.channel.guild.id : '', words[0].toLowerCase());
    if (val) {
        let ccommandName = words[0].toLowerCase();
        let ccommandContent;
        let author;
        if (typeof val == "object") {
            ccommandContent = val.content;
            author = val.author;
        } else {
            ccommandContent = val;
            await bu.ccommand.set(msg.guild.id, ccommandName, {
                content: ccommandContent
            });
        }

        if (await bu.canExecuteCcommand(msg, ccommandName, true)) {
            var command = text.replace(words[0], '').trim();
            command = bu.fixContent(command);
            var response = await tags.processTag(msg, ccommandContent, command, ccommandName, author, true);
            logger.debug(response, msg.channel.id, msg.channel.name);
            if (response !== 'null' && response !== '') {
                bu.send(msg, {
                    content: response,
                    disableEveryone: false
                });
            }
            return true;
        }
    } else {
        if (CommandManager.commandList.hasOwnProperty(words[0].toLowerCase())) {
            let commandName = CommandManager.commandList[words[0].toLowerCase()].name;
            logger.debug(commandName);
            let val2 = await bu.canExecuteCommand(msg, commandName);
            if (val2[0]) {
                try {
                    await executeCommand(commandName, msg, words, text);
                } catch (err) {
                    logger.error(err.stack);
                    bu.send('250859956989853696', {
                        embed: {
                            title: err.message.toString(),
                            color: 0xAD1111,
                            description: err.stack.toString(),
                            timestamp: dep.moment(msg.timestamp),
                            author: {
                                name: bu.getFullName(msg.author),
                                icon_url: msg.author.avatarURL,
                                url: `https://blargbot.xyz/user/${msg.author.id}`
                            },
                            footer: {
                                text: `MSG: ${msg.id}`
                            },
                            fields: [{
                                name: msg.guild ? msg.guild.name : 'DM',
                                value: msg.guild ? msg.guild.id : 'null',
                                inline: true
                            }, {
                                name: msg.channel.name || 'DM',
                                value: msg.channel.id,
                                inline: true
                            }, {
                                name: 'Command',
                                value: commandName,
                                inline: true
                            }, {
                                name: 'Complete Command',
                                value: text,
                                inline: true
                            }]
                        }
                    });
                }
            }
            return val2[0];
        } else {
            return false;
        }
    }
};
var executeCommand = async function(commandName, msg, words, text) {
    // logger.debug(commandName);
    r.table('stats').get(commandName).update({
        uses: r.row('uses').add(1),
        lastused: r.epochTime(dep.moment() / 1000)
    }).run();
    if (bu.commandStats.hasOwnProperty(commandName)) {
        bu.commandStats[commandName]++;
    } else {
        bu.commandStats[commandName] = 1;
    }
    bu.commandUses++;
    try {
        await CommandManager.list[commandName].execute(msg, words, text);
    } catch (err) {
        if (err.response) {
            let response = JSON.parse(err.response);
            logger.debug(response);
            let dmMsg;
            switch (response.code) {
                case 50001:
                    dmMsg = `Hi! You asked me to do something, but I didn't have permission to do it! Please make sure I have permissions to do what you asked.`;
                    break;
            }
            let storedUser = await r.table('user').get(msg.author.id);
            if (dmMsg && !storedUser.dontdmerrors)
                bu.sendDM(msg, dmMsg + '\nGuild: ' + msg.guild.name + '\nChannel: ' + msg.channel.name + '\nCommand: ' + msg.content + '\n\nIf you wish to stop seeing these messages, do the command `dmerrors`.');
        }
        throw err;
    }
    return true;
};



function handleOurMessage(msg) {
    if (msg.channel.id != '194950328393793536')
        if (msg.guild)
            logger.output(`${msg.channel.guild.name} (${msg.channel.guild.id})> ${msg.channel.name} ` +
                `(${msg.channel.id})> ${msg.author.username}> ${msg.content} (${msg.id})`);
        else
            logger.output(`PM> ${msg.channel.name} (${msg.channel.id})> ` +
                `${msg.author.username}> ${msg.content} (${msg.id})`);
}

function handleIRCMessage(msg) {
    if (!(msg.author.id == bot.user.id && msg.content.startsWith('\u200B'))) {
        var message;
        if (msg.content.startsWith('_') && msg.content.endsWith('_'))
            message = ` * ${msg.member && msg.member.nick ? msg.member.nick : msg.author.username} ${msg.cleanContent
.substring(1, msg.cleanContent.length - 1)}`;
        else {
            if (msg.author.id == bot.user.id) {
                message = `${msg.cleanContent}`;
            } else {
                message = `\<${msg.member && msg.member.nick ? msg.member.nick : msg.author.username}\> ${msg.cleanContent}`;
            }
        }
        logger.output(message);
        var attachUrl = '';
        if (msg.attachments.length > 0) {
            logger.debug(dep.util.inspect(msg.attachments[0]));
            attachUrl += ` ${msg.attachments[0].url}`;
        }
        sendMessageToIrc(message + attachUrl);
    }
}

async function handleAntiMention(msg, storedGuild) {
    let antimention;
    antimention = storedGuild.settings.antimention;
    var parsedAntiMention = parseInt(antimention);
    if (!(parsedAntiMention == 0 || isNaN(parsedAntiMention))) {
        if (msg.mentions.length >= parsedAntiMention) {
            if (!bu.bans[msg.channel.guild.id])
                bu.bans[msg.channel.guild.id] = {};

            bu.bans[msg.channel.guild.id][msg.author.id] = {
                mod: bot.user,
                type: 'Auto-Ban',
                reason: 'Mention spam'
            };
            try {
                await bot.banGuildMember(msg.channel.guild.id, msg.author.id, 1);
            } catch (err) {
                delete bu.bans[msg.channel.guild.id][msg.author.id];
                bu.send(msg, `${msg.author.username} is mention spamming, but I lack the permissions to ban them!`);
            }
            return;
        }
    }
}

async function handleCensor(msg, storedGuild) {
    let censor = storedGuild.censor;
    if (censor && censor.list.length > 0) {
        //First, let's check exceptions
        let exceptions = censor.exception;
        if (!(exceptions.channel.includes(msg.channel.id) ||
                exceptions.user.includes(msg.author.id) ||
                (exceptions.role.length > 0 && bu.hasRole(msg, exceptions.role)))) { // doesn't have an exception!
            for (const cens of censor.list) {
                let violation = false;
                let term = cens.term;
                if (cens.regex) {
                    try {
                        let regex = bu.createRegExp(term);
                        if (regex.test(msg.content)) violation = true;
                    } catch (err) {}
                } else if (msg.content.indexOf(term) > -1) violation = true;
                if (violation == true) { // Uh oh, they did a bad!
                    let res = await bu.issueWarning(msg.author, msg.guild, cens.weight);
                    if (cens.weight > 0) {
                        await bu.logAction(msg.guild, msg.author, bot.user, 'Auto-Warning', 'Said a blacklisted phrase.', [{
                            name: 'Warnings',
                            value: `Assigned: ${cens.weight}\nNew Total: ${res.count}`,
                            inline: true
                        }]);
                    }
                    try {
                        await msg.delete();
                        let message = '';
                        switch (res.type) {
                            case 0:
                                if (cens.deleteMessage) message = cens.deleteMessage;
                                else if (censor.rule.deleteMessage) message = censor.rule.deleteMessage;
                                else message = CommandManager.list['censor'].defaultDeleteMessage;
                                break;
                            case 1:
                                if (cens.banMessage) message = cens.banMessage;
                                else if (censor.rule.banMessage) message = censor.rule.banMessage;
                                else message = CommandManager.list['censor'].defaultBanMessage;
                                break;
                            case 2:
                                if (cens.kickMessage) message = cens.kickMessage;
                                else if (censor.rule.kickMessage) message = censor.rule.kickMessage;
                                else message = CommandManager.list['censor'].defaultKickMessage;
                                break;
                        }
                        let output = await tags.processTag(msg, message, '', undefined, undefined, true);
                        bu.send(msg, output);
                        return;
                    } catch (err) {
                        bu.send(msg, `${bu.getFullName(msg.author)} said a blacklisted word, but I was not able to delete it.`);
                    }
                }
            }
        }
    }
}

async function handleRoleme(msg, storedGuild) {
    if (storedGuild && storedGuild.roleme) {
        let roleme = storedGuild.roleme.filter(m => m.channels.indexOf(msg.channel.id) > -1 || m.channels.length == 0);
        if (roleme.length > 0) {
            for (let i = 0; i < roleme.length; i++) {
                let caseSensitive = roleme[i].casesensitive;
                let message = roleme[i].message;
                let content = msg.content;
                if (!caseSensitive) {
                    message = message.toLowerCase();
                    content = content.toLowerCase();
                }
                if (message == content) {
                    console.info(`A roleme was triggered > ${msg.guild.name} (${msg.guild.id}) > ${msg.channel.name} (${msg.channel.id}) > ${msg.author.username} (${msg.author.id})`);
                    let roleList = msg.member.roles;
                    let add = roleme[i].add;
                    let del = roleme[i].remove;
                    for (let ii = 0; ii < add.length; ii++) {
                        if (roleList.indexOf(add[ii]) == -1) roleList.push(add[ii]);
                    }
                    for (let ii = 0; ii < del.length; ii++) {
                        if (roleList.indexOf(del[ii]) > -1) roleList.splice(roleList.indexOf(del[ii]), 1);
                    }
                    try {
                        await msg.member.edit({
                            roles: roleList
                        });
                        bu.send(msg, 'Your roles have been edited!');
                    } catch (err) {
                        bu.send(msg, 'A roleme was triggered, but I don\'t have the permissions required to give you your role!');
                    }
                }
            }
        }
    }
}

async function handleBlacklist(msg, storedGuild, prefix) {
    let blacklisted;
    if (msg.guild && storedGuild.channels[msg.channel.id])
        blacklisted = storedGuild.channels[msg.channel.id].blacklisted;

    return (blacklisted && !(await bu.isUserStaff(msg.author.id, msg.guild.id)));
}

function logCommand(msg) {
    bu.send('243229905360388106', {
        embed: {
            description: msg.content,
            fields: [{
                name: msg.guild ? msg.guild.name : 'DM',
                value: msg.guild ? msg.guild.id : 'null',
                inline: true
            }, {
                name: msg.channel.name || 'DM',
                value: msg.channel.id,
                inline: true
            }],
            author: {
                name: bu.getFullName(msg.author),
                icon_url: msg.author.avatarURL,
                url: `https://blargbot.xyz/user/${msg.author.id}`
            },
            timestamp: dep.moment(msg.timestamp),
            footer: {
                text: `MsgID: ${msg.id}`
            }
        }
    });
}

function handleDeleteNotif(msg, storedGuild) {
    let deletenotif = storedGuild.settings.deletenotif;
    if (deletenotif != '0') {
        if (!bu.commandMessages[msg.channel.guild.id]) {
            bu.commandMessages[msg.channel.guild.id] = [];
        }
        bu.commandMessages[msg.channel.guild.id].push(msg.id);
        if (bu.commandMessages[msg.channel.guild.id].length > 100) {
            bu.commandMessages[msg.channel.guild.id].shift();
        }
    }
}

function handleCleverbot(msg) {
    dep.Cleverbot.prepare(function() {
        var username = msg.channel.guild.members.get(bot.user.id).nick ?
            msg.channel.guild.members.get(bot.user.id).nick :
            bot.user.username;
        var msgToSend = msg.cleanContent.replace(new RegExp('@' + username + ',?'), '').trim();
        logger.debug(msgToSend);
        bu.cleverbotStats++;
        cleverbot.write(msgToSend, function(response) {
            bot.sendChannelTyping(msg.channel.id);
            setTimeout(function() {
                bu.send(msg, response.message);
            }, 1500);
        });
    });
}


function handleAwaitMessage(msg) {
    if (bu.awaitMessages.hasOwnProperty(msg.channel.id) &&
        bu.awaitMessages[msg.channel.id].hasOwnProperty(msg.author.id)) {
        let firstTime = bu.awaitMessages[msg.channel.id][msg.author.id].time;
        if (dep.moment.duration(dep.moment() - firstTime).asMinutes() <= 5) {
            bu.emitter.emit(bu.awaitMessages[msg.channel.id][msg.author.id].event, msg);
        }
    }
}

function handleTableflip(msg) {
    if (msg.content.indexOf('(╯°□°）╯︵ ┻━┻') > -1 && !msg.author.bot) {
        flipTables(msg, false);
    }
    if (msg.content.indexOf('┬─┬﻿ ノ( ゜-゜ノ)') > -1 && !msg.author.bot) {
        flipTables(msg, true);
    }
}