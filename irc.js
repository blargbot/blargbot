var irc = require('irc');
var fs = require('fs');
var util = require('util');
var moment = require('moment-timezone');
var mkdirp = require('mkdirp');
var path = require('path');
var http = require('http');
var freefreefree = require('./dcommands/free.js');

var Cleverbot = require('cleverbot-node');
cleverbot = new Cleverbot();

var e = module.exports = {};
e.requireCtx = require;
//var gm = require('gm');
var Cleverbot = require('cleverbot-node');


// TODO: Refactor this mess

var ircUserList = {};
var emitter;

var notifInterval;
var VERSION;

e.init = (v, em) => {
    VERSION = v;
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
            bot.executeWebhook(config.irc.webhookId, config.irc.webhookToken, {
                username: from,
                content: text,
                disableEveryone: true
            });
            // sendMessageToDiscord(userMessage);

            if (text.startsWith('!')) {
                try {
                    handleIrcCommand(to, from, text.replace('!', ''));
                } catch (err) {
                    logger.irc(err.stack);
                }
            } else if (text.startsWith('blargbot, ')) {
                //logger.irc(message);
                logger.irc(text);
                var messageForCleverbot = text.replace('blargbot, ');
                Cleverbot.prepare(function() {
                    cleverbot.write(messageForCleverbot, function(response) {
                        logger.irc(messageForCleverbot);
                        logger.irc(response);
                        ///botIrc.sendChannelTyping(msg.channel.id);
                        setTimeout(function() {
                            sendIrcCommandMessage(to, response.message);
                            //   botIrc.sendChannelTyping(msg.channel.id);
                        }, 1500);
                    });
                });
            }
        }
    });

    botIrc.addListener('join', function(channel, nick, message) {
        var joinMessage = `${nick} (${message.user}@${message.host}) has joined ${channel}`;
        logger.irc(`[IRC] ${joinMessage}`);
        if (channel === config.irc.channel) {
            sendMessageToDiscord(joinMessage);
        }
        if (nick !== botIrc.nick) {
            //logger.irc(getUserFilePath(nick));
            //logger.irc(fs.existsSync(getUserFilePath(nick)));
            if (!fs.existsSync(getUserFilePath(nick))) {
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
                userFile.seen = moment().format();
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
        userFile.seen = moment().format();
        saveUserFile(nick, userFile);
        reloadUserList();
    });

    botIrc.addListener('part', function(channel, nick, reason, message) {
        var quitMessage = `${nick} (${message.host}) has parted (Reason: ${reason})`;
        logger.irc(`[IRC] ${quitMessage}`);
        sendMessageToDiscord(quitMessage);
        var userFile = getUserFile(nick);
        userFile.seen = moment().format();
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
        userFile.seen = moment().format();
        saveUserFile(oldnick, userFile);
        if (!fs.existsSync(getUserFilePath(newnick))) {
            logger.irc(`[IRC] Generating userfile for ${newnick}`);
            sendIrcCommandMessage(config.irc.channel, `Welcome ${newnick}. I hope you enjoy your stay.`);
            createDefaultUserFile(newnick);
        } else {

            userFile = getUserFile(newnick);
            userFile.seen = moment().format();
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
        case 'time':
            getTime(channel, user, words);
            break;
        case 'free':
            //    botIrc.sendChannelTyping(channelid);

            freefreefree.generateImage(channel, text.replace(words[0], '').trim()).then((image) => {
                sendDiscordAttachment(config.discord.channel, `It really works!`, {
                    file: image,
                    name: 'freefreefree.gif'
                });
            });

            break;
        case 'servers':
            var servers;
            if (!fs.existsSync('servers.json')) {
                servers = {
                    example: 'server'
                };
                fs.writeFile('servers.json', JSON.stringify(servers, null, 4));
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
                            var timeStamp = `[${moment().format('MM/DD HH:mm')}]`;
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
                    time = createTimeDiffString(moment(), moment(userFile.seen));
                    logger.irc(time, moment(), moment(userFile.seen), userFile.seen);
                    sendIrcCommandMessage(channel, `I haven't seen ${words[1]} in ${time}`);
                }
            } catch (err) {
                sendIrcCommandMessage(channel, `I don't think I've ever seen ${words[1]} before!`);
            }
            break;
        case 'uptime':
            var uptimeString = `Catter uptime: ${createTimeDiffString(moment(), startTime)}`;
            sendIrcCommandMessage(channel, uptimeString);
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
        case 'version':
            sendIrcCommandMessage(channel, `I am running blargbot version ${VERSION}`);
            break;
        case 'cat':
            logger.irc('meow');
            getCat(channel);
            break;
        case 'roll':
            getRoll(channel, user, words);
            break;
        case 'insult':
            getInsult(channel, words);
            break;
        case 'econ':
            getEcon(channel, words);
            break;
        case 'xkcd':
            getXkcd(channel, words);
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
mkdirp(userdataDir);

function getUserFilePath(name) {
    return path.join(__dirname, `${userdataDir}/${name}.json`.toLowerCase());
}

function createDefaultUserFile(name) {
    var defaultContents = {
        name: name,
        read: true,
        number: 0,
        notify: true,
        seen: moment().format(),
        mail: {}
    };

    logger.irc(defaultContents);
    saveUserFile(name, defaultContents);
}

function saveUserFile(name, file) {
    fs.writeFileSync(getUserFilePath(name), JSON.stringify(file, null, 4));
}

function getUserFile(name, dontCreate) {
    if (!dontCreate && !fs.existsSync(getUserFilePath(name))) {
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
    return JSON.parse(fs.readFileSync(path, 'utf8'));
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

function getCat(channel) {
    var output;
    http.get('http://random.cat/meow', function(res) {
        var body = '';
        res.on('data', function(chunk) {
            body += chunk;
        });

        res.on('end', function() {
            logger.irc(body);
            output = JSON.parse(body);
            sendMessageToIrc(channel, output.file);
        });
    });
}

var xkcdMax = 0;

function getXkcd(channel, words) {
    if (xkcdMax === 0) {
        http.get('http://xkcd.com/info.0.json', function(res) {
            var body = '';
            res.on('data', function(chunk) {
                body += chunk;
            });
            res.on('end', function() {
                logger.irc(body);
                var output = JSON.parse(body);
                xkcdMax = output.num;
                getXkcd(channel, words);

                //sendMessageToIrc(channel, output.file);
            });
        });
        return;
    }
    var choice;
    if (words.length === 1) {
        choice = getRandomInt(1, xkcdMax);
    } else {
        choice = parseInt(words[1]);
        if (choice > xkcdMax || choice < 0) {
            sendMessageToIrc(channel, `Comic #${choice} does not exist!`);
        }
    }
    var url = '';
    if (choice === 0) {
        url = 'http://xkcd.com/info.0.json';
    } else {
        url = `http://xkcd.com/${choice}/info.0.json`;
    }
    http.get(url, function(res) {
        var body = '';
        res.on('data', function(chunk) {
            body += chunk;
        });
        res.on('end', function() {
            logger.irc(body);
            var output = JSON.parse(body);
            var message = '';
            if (bot === botIrcEnum.DISCORD) {
                message = `${output.img}
\`\`\`diff
!=-= [ ${output.title}, ${output.year} ] =-=!
Comic #${output.num}
+ ${output.alt}
\`\`\``;
            } else {
                message = `${output.img}
!=-= [ ${output.title}, ${output.year} ] =-=!
Comic #${output.num}
+ ${output.alt}`;
            }
            sendMessageToIrc(channel, message);
            xkcdMax = output.num;
            //getXkcd(channel, words);
            //sendMessageToIrc(channel, output.file);
        });
    });
}

function getTime(channel, user, words) {
    var message = 'meow';
    logger.irc(util.inspect(words));
    if (words.length > 1) {
        var location = words[1].split('/');
        if (location.length == 2)
            message = `In ${location[1]}, it is currently ${moment().tz(words[1]).format('LTS')}`;
        else {
            message = 'Invalid parameters! See https://en.wikipedia.org/wiki/List_of_tz_database_time_zones for timezone codes that I understand.';
        }
    }

    sendMessageToIrc(channel, message);
}

function createTimeDiffString(moment1, moment2) {

    var ms = moment1.diff(moment2);

    var diff = moment.duration(ms);
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

function getRoll(channel, user, words) {
    var i;
    var total;
    var message = ``;
    if (bot === botIrcEnum.DISCORD) {
        message += `<@${user.id}>, `;
    } else if (bot === botIrcEnum.IRC) {
        message += `${user}, `;
    }
    message += `Rolling `;
    var max = 20;
    var rollList = [];
    if (words.length > 1) {
        if (words[1].indexOf('cat') > -1) {
            var catUrl;
            var seed = getRandomInt(0, 3);
            logger.irc(`The cat chosen is ${seed} `);
            switch (seed) {
                case 0:
                    catUrl = 'http://gifrific.com/wp-content/uploads/2013/06/Cat-Rolls-In-A-Ball.gif';
                    break;
                case 1:
                    catUrl = 'http://random.cat/i/024_-_H1NMbQr.gif';
                    break;
                case 2:
                    catUrl = 'http://random.cat/i/081_-_DWzDbUH.gif';
                    break;
                default:
                    catUrl = 'http://gifrific.com/wp-content/uploads/2013/06/Cat-Rolls-In-A-Ball.gif';
                    break;
            }
            sendMessageToIrc(channel, catUrl);
            return;
        }
        if (words[1].indexOf('rick') > -1) {
            sendMessageToIrc(channel, 'http://static.celebuzz.com/uploads/2015/08/rick-roll-82415-1.gif');
            return;
        }
        if (words[1] == 'character') {
            //  sendMessageToIrc(channel, 'So you want to roll a character, huh?');
            message = 'Rolling a character:\n```xl\n';
            for (var ii = 0; ii < 6; ii++) {
                message += `Stat #${ii + 1} - [`;
                var rolls = [];
                for (i = 0; i < 4; i++) {
                    var roll = getRandomInt(1, 6);
                    rolls.push(roll);
                    message += `${roll}, `;
                }
                rolls.sort();
                total = 0;
                for (i = 0; i < rolls.length; i++) {
                    total += rolls[i];
                }
                var newtotal = total - rolls[0];
                message = `${message.substring(0, message.length - 2)}] > ${total < 10 && total > -10 ? ` ${total}` : total} - ${rolls[0]} > ${newtotal < 10 && newtotal > -10 ? ` ${newtotal}` : newtotal}\n`;
                logger.irc(message);
            }
            sendMessageToIrc(channel, `${message}\n\`\`\``);

            return;
        }
        if (words[1].indexOf('d') > -1) {
            var dice = words[1].split('d');
            max = dice[1];
            message += `${dice[0]}d${max}`;
            for (i = 0; i < dice[0]; i++) {
                rollList[i] = getRandomInt(1, max);
            }
        } else {
            max = words[1];
            message += `1d${max}`;
            rollList[0] = getRandomInt(1, max);
        }
    } else {
        max = 20;
        message += `1d${max}`;
        rollList[0] = getRandomInt(1, max);
    }
    message += ` - [`;
    total = 0;
    for (i = 0; i < rollList.length; i++) {
        total += rollList[i];
        message += `${rollList[i]}, `;
    }

    message = message.substring(0, message.length - 2);
    message += `] > ${total}`;

    if (words.length > 2) {
        var newTotal = total + parseInt(words[2]);
        message += ` + ${parseInt(words[2])} > ${newTotal}`;
    }

    if (bot === botIrcEnum.DISCORD && channel !== config.discord.channel) {
        if (rollList.length == 1 && max == 20 && rollList[0] == 20) {
            message += `\`\`\`diff
+ NATURAL 20
\`\`\``;
        } else if (rollList.length == 1 && max > 1 && rollList[0] == 1) {
            message += `\`\`\`diff
- Natural 1...
\`\`\``;
        }
    }
    sendMessageToIrc(channel, message);
}

function getInsult(channel, words) {
    var target = '';
    if (words.length === 1) {
        target = 'Your';
    } else {
        for (var i = 1; i < words.length; i++) {
            target += words[i] + ' ';
        }
        target = target.substring(0, target.length - 1);
    }
    var chosenNoun = config.insult.nouns[(getRandomInt(0, config.insult.nouns.length - 1))];
    var chosenVerb = config.insult.verbs[(getRandomInt(0, config.insult.verbs.length - 1))];
    var chosenAdje = config.insult.adjectives[(getRandomInt(0, config.insult.adjectives.length - 1))];
    var message = `${target}'s ${chosenNoun} ${chosenVerb} ${chosenAdje}!`;
    sendMessageToIrc(channel, message);
}

function getEcon(channel, words) {
    if (words.length < 4) {
        sendMessageToIrc(channel, 'Incorrect usage!\n`econ \<from> \<to> \<amount>`');
        return;
    }
    var to = words[2].toUpperCase();
    var from = words[1].toUpperCase();
    var convert = words[3];

    var url = `http://api.fixer.io/latest?symbols=${to}&base=${from}`;

    http.get(url, function (res) {
        var body = '';
        res.on('data', function (chunk) {
            body += chunk;
        });
        res.on('end', function () {
            var rates = JSON.parse(body);
            if (rates.error != null && rates.error === 'Invalid base') {
                sendMessageToIrc(channel, `Invalid currency ${from}\n\`econ \<from\> \<to\> \<amount\>\``);
                return;
            }
            if (rates.rates[to] == null) {
                sendMessageToIrc(channel, `Invalid currency ${to}\n\`econ \<from\> \<to\> \<amount\>\``);
                return;
            }
            var converted = Math.round((convert * rates.rates[to]) * 100.0) / 100;
            var message = `${convert} ${from} is equivalent to ${converted} ${to}`;
            sendMessageToIrc(channel, message);

        });
    });
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}