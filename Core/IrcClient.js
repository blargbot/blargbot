var irc = require('irc');

const cleverbot = new dep.cleverbotIo();
const http = dep.http;
var e = module.exports = {};
e.requireCtx = require;
var botIrc;

// TODO: Refactor this mess

var ircUserList = {};
var emitter;

var notifInterval;
var VERSION;

e.init = (v, em) => {
    VERSION = config.version;
    emitter = em;
    var ircbot = new irc.Client(config.irc.server, config.irc.nick, {
        channels: [config.irc.channel],
        realName: 'blargbot',
        userName: 'blargbot',
        autoRejoin: true
    });
    e.bot = botIrc = ircbot;

    notifInterval = setInterval(function() {
        logger.irc('[NOT] Doing notifications');
        for (var user in ircUserList) {
            if (user !== botIrc.nick) {
                var tempFile = getUserFile(user);
                if (tempFile.notify) {
                    if (!tempFile.read) {
                        sendNoticeToIrc(user, 'You have unread messages. Type \'!mail read\' to read them.');
                    }
                }
            }
        }
    }, config.general.notification_timer * 60000);

    emitter.on('ircMessage', (message) => {
        sendMessageToIrc(config.irc.channel, message);
    });
    emitter.on('ircUserList', () => {
        reloadUserList();
    });

    botIrc.addListener('motd', function() {
        sendMessageToIrc('nickserv', `identify ${config.irc.nickserv_name} ${config.irc.nickserv_pass}`);
    });

    botIrc.addListener('names', function(channel, nicks) {
        var message = 'Online Users: ';
        for (var key in nicks) {
            message += `${key}, `;
            ircUserList[key] = '';
        }
        ///  ircUserList = nicks;
        logger.irc(message);
        changeDiscordTopic(message);
    });

    botIrc.addListener('message', function(from, to, text) {
        var userMessage = `\<${from}\> ${text}`;
        logger.irc(`[IRC] ${from}> ${to}> ${text}`);
        // logger.irc(userMessage);
        if (to === config.irc.channel) {
            let avatar;
            let userFile = getUserFile(from);
            if (userFile.avatar) avatar = userFile.avatar;
            bot.executeWebhook(config.irc.webhookId, config.irc.webhookToken, {
                username: from,
                avatarURL: avatar,
                content: text,
                disableEveryone: true
            });
        }
        // sendMessageToDiscord(userMessage);

        if (text.startsWith('!')) {
            try {
                handleIrcCommand(to, from, text.replace('!', ''));
            } catch (err) {
                logger.irc(err.stack);
            }
        } else if (text.startsWith('blargbot, ')) {}
    });

    botIrc.addListener('join', function(channel, nick, message) {
        var joinMessage = `${nick} (${message.user}@${message.host}) has joined ${channel}`;
        logger.irc(`[IRC] ${joinMessage}`);
        if (channel === config.irc.channel) {
            sendMessageToDiscord(joinMessage);
        }
        if (nick !== botIrc.nick) {
            //logger.irc(getUserFilePath(nick));
            //logger.irc(dep.fs.existsSync(getUserFilePath(nick)));
            if (!dep.fs.existsSync(getUserFilePath(nick))) {
                logger.irc(`[IRC] Generating userfile for ${nick}`);
                sendIrcCommandMessage(config.irc.channel, `Welcome ${nick}. I hope you enjoy your stay.`);
                createDefaultUserFile(nick);
            } else {
                var userFile = getUserFile(nick);
                var welcomeMessage = `Welcome back, ${nick}.`;
                if (!userFile.read) {
                    welcomeMessage += ` You have unread messages. Type '!mail read' to read them.`;
                }
                sendNoticeToIrc(nick, welcomeMessage);
                userFile.seen = dep.moment().format();
                saveUserFile(nick, userFile);
            }
        }
        reloadUserList();
    });

    botIrc.addListener('quit', function(nick, reason, channels, message) {
        var quitMessage = `${nick} (${message.host}) has quit (Reason: ${reason})`;
        logger.irc(`[IRC] ${quitMessage}`);
        sendMessageToDiscord(quitMessage);
        var userFile = getUserFile(nick);
        userFile.seen = dep.moment().format();
        saveUserFile(nick, userFile);
        reloadUserList();
    });

    botIrc.addListener('part', function(channel, nick, reason, message) {
        var quitMessage = `${nick} (${message.host}) has parted (Reason: ${reason})`;
        logger.irc(`[IRC] ${quitMessage}`);
        sendMessageToDiscord(quitMessage);
        var userFile = getUserFile(nick);
        userFile.seen = dep.moment().format();
        saveUserFile(nick, userFile);
        reloadUserList();
    });

    botIrc.addListener('nick', function(oldnick, newnick, channels, message) {
        if (oldnick === botIrc.nick || newnick === botIrc.nick) {
            return;
        }
        var nickMessage = `${oldnick} (${message.host}) is now known as ${newnick}`;
        logger.irc(nickMessage);

        //   logger.irc(`[IRC] ${nickMessage}`);
        var userFile = getUserFile(oldnick);
        userFile.seen = dep.moment().format();
        saveUserFile(oldnick, userFile);
        if (!dep.fs.existsSync(getUserFilePath(newnick))) {
            logger.irc(`[IRC] Generating userfile for ${newnick}`);
            sendIrcCommandMessage(config.irc.channel, `Welcome ${newnick}. I hope you enjoy your stay.`);
            createDefaultUserFile(newnick);
        } else {

            userFile = getUserFile(newnick);
            userFile.seen = dep.moment().format();
            saveUserFile(newnick, userFile);
        }
        reloadUserList();
        sendMessageToDiscord(nickMessage);

    });

    //botIrc.addListener('motd', function (motd) {
    //     logger.irc(motd);
    //  });

    botIrc.addListener('action', (sender, channel, text) => {
        sendMessageToDiscord(` * ${sender} ${text}`);
    });

    botIrc.addListener('error', function(message) {
        logger.irc('An IRC error occured: ', message);
    });
};

function handleIrcCommand(channel, user, text) {
    var words = text.split(' ');
    logger.irc(`[IRC] User ${user} executed command ${words[0]}`);
    var time, userFile;
    switch (words[0].toLowerCase()) {
        case 'help':
            sendIrcCommandMessage(channel, 'Valid commands: servers, ping, mail, seen, uptime, ' +
                'notify, version, cat, roll, xkcd, insult, econ, reload, time');
            break;
        case 'list':
            var userArray = bu.bot.guilds.get(bu.bot.channelGuildMap[config.discord.channel]).members.filter(m => m.status != 'offline').map(m => m.user.username);
            userArray.sort();
            sendIrcCommandMessage(channel, 'Users online on discord: ' + userArray.join(', '));
            break;
        case 'reload':
            reloadConfig();
            sendIrcCommandMessage(channel, `Reloaded config`);
            break;
        case 'servers':
            var servers;
            if (!dep.fs.existsSync('servers.json')) {
                servers = {
                    example: 'server'
                };
                dep.fs.writeFile('servers.json', JSON.stringify(servers, null, 4));
            } else {
                servers = getJsonFile('servers.json');
            }
            for (var key in servers.servers) {
                sendIrcCommandMessage(channel, `${key}: ${servers.servers[key]}`);
            }
            break;
        case 'ping':
            sendIrcCommandMessage(channel, `Pong!`);
            break;
        case 'mail':
            if (words.length == 1) {
                sendIrcCommandMessage(channel, `Mail commands: read, send, mark`);
            } else {
                switch (words[1]) {
                    case 'send':
                        if (words.length <= 3) {
                            sendIrcCommandMessage(channel, 'You are missing parameters - !mail send \<name\> \<message\>');
                        } else {
                            var recipient = words[2];
                            userFile = getUserFile(recipient);
                            var timeStamp = `[${dep.moment().format('MM/DD HH:mm')}]`;
                            var messageToSend = text.replace(`mail send ${recipient} `, '');
                            userFile.mail[userFile.number] = {
                                read: false,
                                sender: user,
                                message: messageToSend,
                                timestamp: timeStamp
                            };
                            userFile.number += 1;
                            userFile.read = false;
                            saveUserFile(recipient, userFile);
                            sendNoticeToIrc(user,
                                `Message queued: '${messageToSend}' to ${recipient} at ${timeStamp}`);
                        }
                        break;
                    case 'read':
                        userFile = getUserFile(user);
                        var readAll = false;
                        if (words.length > 2 && words[2] === 'all') {
                            sendNoticeToIrc(user, `Showing all recorded messages.`);
                            readAll = true;
                        } else {
                            sendNoticeToIrc(user, `You received the following messages:`);
                        }
                        var ii = 1;
                        var hadMessages = false;
                        for (var i = 0; i < userFile.number; i++) {
                            if (readAll) {
                                sendNoticeToIrc(user,
                                    `${i + 1}. ${userFile.mail[i].timestamp} \<${userFile.mail[i].sender}\> ${userFile.mail[i].message}`);
                                if (!hadMessages) {
                                    hadMessages = true;
                                }
                            } else {
                                if (!userFile.mail[i].read) {
                                    sendNoticeToIrc(user,
                                        `${ii}. ${userFile.mail[i].timestamp} \<${userFile.mail[i].sender}\> ${userFile.mail[i].message}`);
                                    ii++;
                                    if (!hadMessages) {
                                        hadMessages = true;
                                    }
                                }
                            }
                        }
                        if (!hadMessages) {
                            sendNoticeToIrc(user, `No messages to display.`);
                        } else {
                            sendNoticeToIrc(user, `Do '!mail mark' to mark these messages are read`);
                        }
                        break;
                    case 'mark':
                        userFile = getUserFile(user);

                        for (key in userFile.mail) {
                            if (!userFile.mail[key].read) {
                                userFile.mail[key].read = true;
                            }
                        }
                        userFile.read = true;
                        saveUserFile(user, userFile);
                        sendNoticeToIrc(user, `Marked all messages as read`);
                        break;
                    default:
                        sendIrcCommandMessage(channel, `Mail commands: read, send, mark`);
                        break;
                }
            }
            break;
        case 'seen':
            try {
                if (words[1].toLowerCase() in ircUserList) {
                    sendIrcCommandMessage(channel, `${words[1]} is online right now!`);
                } else {
                    userFile = getUserFile(words[1], true);
                    time = createTimeDiffString(dep.moment(), dep.moment(userFile.seen));
                    logger.irc(time, dep.moment(), dep.moment(userFile.seen), userFile.seen);
                    sendIrcCommandMessage(channel, `I haven't seen ${words[1]} in ${time}`);
                }
            } catch (err) {
                sendIrcCommandMessage(channel, `I don't think I've ever seen ${words[1]} before!`);
            }
            break;
        case 'notify':
            userFile = getUserFile(user);
            userFile.notify = !userFile.notify;
            saveUserFile(user, userFile);
            if (userFile.notify) {
                sendIrcCommandMessage(channel, `Enabled notifications for ${user}`);
            } else {
                sendIrcCommandMessage(channel, `Disabled notifications for ${user}`);
            }
            break;
        case 'avatar':
            userFile = getUserFile(user);
            userFile.avatar = words[1];
            logger.debug(userFile);
            saveUserFile(user, userFile);
            sendIrcCommandMessage(channel, `Set ${user}'s discord avatar!'`);

            break;
        case 'version':
            sendIrcCommandMessage(channel, `I am running blargbot version ${VERSION}`);
            break;
    }
}

function reloadUserList() {
    botIrc.send('NAMES', config.irc.channel);
}


function sendNoticeToIrc(channel, notice) {
    logger.irc(`[IRC] blargbot -> ${channel} -> ${notice}`);
    botIrc.notice(channel, notice);
}

function sendIrcCommandMessage(channel, message) {
    if (channel === config.irc.channel) {
        sendMessageToDiscord(message);
    }
    sendMessageToIrc(channel, message);
}

function sendMessageToIrc(channel, message) {
    logger.irc(`[IRC] blargbot> ${channel}> ${message}`);
    botIrc.say(channel, message);
}

var userdataDir = 'userdata';
dep.mkdirp(userdataDir);

function getUserFilePath(name) {
    return dep.path.join(__dirname, `${userdataDir}/${name}.json`.toLowerCase());
}

function createDefaultUserFile(name) {
    var defaultContents = {
        name: name,
        read: true,
        number: 0,
        notify: true,
        seen: dep.moment().format(),
        mail: {}
    };

    logger.irc(defaultContents);
    saveUserFile(name, defaultContents);
}

function saveUserFile(name, file) {
    dep.fs.writeFileSync(getUserFilePath(name), JSON.stringify(file, null, 4));
}

function getUserFile(name, dontCreate) {
    if (!dontCreate && !dep.fs.existsSync(getUserFilePath(name))) {
        createDefaultUserFile(name);
    }
    try {
        return getJsonFile(getUserFilePath(name));
    } catch (err) {
        logger.irc(err);
        sendIrcCommandMessage(config.irc.channel, `The userfile for ${name} is broken or corrupt! Generating a new one.`);
        createDefaultUserFile(name);
        logger.irc('why');
        return getJsonFile(getUserFilePath(name));
    }
}

function getJsonFile(path) {
    return JSON.parse(dep.fs.readFileSync(path, 'utf8'));
}

function sendMessageToDiscord(msg) {
    // logger.irc(msg);
    emitter.emit('discordMessage', '\u200B' + msg);
}

function changeDiscordTopic(topic) {
    emitter.emit('discordTopic', topic);
}

function reloadConfig() {
    emitter.emit('reloadConfig');
}

//function saveConfig() {
//    emitter.emit('saveConfig');
//}

function sendDiscordAttachment(msg, attach) {
    emitter.emit('discordMessage', msg, attach);
}

function createTimeDiffString(moment1, moment2) {

    var ms = moment1.diff(moment2);

    var diff = dep.moment.duration(ms);
    //  logger.irc(diff.humanize());
    var days = diff.days();
    diff.subtract(days, 'd');
    var hours = diff.hours();
    diff.subtract(hours, 'h');
    var minutes = diff.minutes();
    diff.subtract(minutes, 'm');
    var seconds = diff.seconds();
    return `${days} days, ${hours} hours, ${minutes} minutes, and ${seconds} seconds`;

}


function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}