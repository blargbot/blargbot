var e = module.exports = {}
var bu = require('./util.js')
var moment = require('moment-timezone')
var util = require('util')
var bu = require('./util.js')

var bot
e.init = (Tbot) => {
    bot = Tbot
}

e.processTag = (msg, contents, command) => {
    var words = command.replace(/ +/g, ' ').split(' ');

    if (contents.split(' ')[0].indexOf('help') > -1) {
        contents = '\u200B' + contents;
    }
    contents = contents.replace(/\{channelid}/gi, msg.channel.id)
        .replace(/\{channelname}/gi, msg.channel.name)
        .replace(/\{channelpos}/gi, msg.channel.position)
        .replace(/\{guildid}/gi, msg.channel.guild.id)
        .replace(/\{guildname}/gi, msg.channel.guild.name)
        .replace(/\{guildmembers}/gi, msg.channel.guild.memberCount)
        .replace(/\{guildownerid}/gi, msg.channel.guild.ownerID)
        .replace(/\{guildownername}/gi, bot.users.get(msg.channel.guild.ownerID).username)
        .replace(/\{guildownernick}/gi, msg.channel.guild.members.get(msg.channel.guild.ownerID).nick ? msg.channel.guild.members.get(msg.channel.guild.ownerID).nick : bot.users.get(msg.channel.guild.ownerID).username)
        .replace(/\{guildicon}/gi, `https://cdn.discordapp.com/icons/${msg.channel.guild.id}/${msg.channel.guild.icon}.jpg`)
        .replace(/\{guilddefaultchannelid}/gi, msg.channel.guild.defaultChannel.id)
        .replace(/\{guilddefaultchannelname}/gi, msg.channel.guild.defaultChannel.name)
        .replace(/\{nsfw}/gi, '')
        .replace(/\{rb}/gi, '&rb;')
        .replace(/\{lb}/gi, '&lb;');

    var fallback = '';
    while (contents.indexOf('{') > -1 && contents.indexOf('}') > -1 &&
        contents.indexOf('{') < contents.indexOf('}')) {
        var tagEnds = contents.indexOf('}');
        var tagBegins = tagEnds == -1 ? -1 : contents.lastIndexOf('{', tagEnds);
        var tagBrackets = contents.substring(tagBegins, tagEnds + 1);
        var tag = contents.substring(tagBegins + 1, tagEnds);
        var args = tag.split(';');
        var replaceString = '';
        switch (args[0].toLowerCase()) {
            case 'randuser':
                replaceString = msg.channel.guild.members.map(m => m)[bu.getRandomInt(0, msg.channel.guild.members.map(m => m).length - 1)].user.id;
                break;
            case '//':
                break
            case 'fallback':
                if (args[1])
                    fallback = args[1]
                break;
            case 'randint':
                //console.log(args.length);
                if (args.length == 2) {
                    replaceString = bu.bu.getRandomInt(0, parseInt(args[1]));
                } else if (args.length > 2) {
                    replaceString = bu.bu.getRandomInt(parseInt(args[1]), parseInt(args[2]));
                } else {
                    replaceString = tagProcessError(fallback, '`Not enough arguments`');
                }
                break;
            case 'args':
                if (args.length > 2) {
                    var min = parseInt(args[1]);
                    var max = args[2] == 'n' ? words.length : parseInt(args[2]);
                    //console.log(max);
                    if (min < max) {
                        for (var i = min; i < max; i++) {
                            if (words[i])
                                replaceString += ` ${words[i]}`;
                        }
                    } else {
                        replaceString = tagProcessError(fallback, '`MIN is greater than MAX`');
                    }

                } else if (args.length == 2) {
                    if (words[parseInt(args[1])]) {
                        replaceString = words[parseInt(args[1])];
                    } else {
                        replaceString = tagProcessError(fallback, '`Not enough arguments`');
                    }
                } else {
                    //console.log(words.length, util.inspect(words));

                    if (!(words[0] == '' && words.length == 1)) {
                        replaceString = command;
                    }
                    else
                        replaceString = tagProcessError(fallback, '`User gave no args`');
                }
                break;
            case 'argslength':
                replaceString = words.length
                break;
            case 'randchoose':
                if (args.length > 1) {
                    replaceString = args[bu.getRandomInt(1, args.length)];
                } else {
                    replaceString = tagProcessError(fallback, '`Not enough arguments`');
                }
                break;
            case 'choose':
                if (args.length > 2) {
                    replaceString = args[parseInt(args[1]) + 2];
                    if (!replaceString) {
                        replaceString = args[2];
                    }
                } else
                    replaceString = tagProcessError(fallback, '`Not enough arguments`');
                break;
            case 'replace':
                if (args.length > 3) {
                    replaceString = args[1].replace(args[2], args[3]);
                } else if (args.length == 3) {
                    contents = contents.replace(args[1], args[2]);
                } else {
                    replaceString = tagProcessError(fallback, '`Not enough arguments`');
                }
                break;
            case 'regexreplace':
                if (args.length > 3) {
                    if (/^\/?.*\/.*/.test(args[2])) {
                        //var
                        var regexList = args[2].match(/^\/?(.*)\/(.*)/);
                        replaceString = args[1].replace(new RegExp(regexList[1], regexList[2]), args[3]);
                    } else {
                        replaceString = tagProcessError(fallback, '`Invalid regex string`');
                    }
                } else if (args.length == 3) {
                    if (/^\/?.*\/.*/.test(args[1])) {
                        try {
                            var regexList = args[1].match(/^\/?(.*)\/(.*)/);
                            contents = contents.replace(new RegExp(regexList[1], regexList[2]), args[2]);
                        } catch (err) {
                            replaceString = tagProcessError(fallback, err.message);
                        }
                    } else {
                        replaceString = tagProcessError(fallback, '`Invalid regex string`');
                    }
                } else {
                    replaceString = tagProcessError(fallback, '`Not enough arguments`');
                }
                break;
            case 'get':
                if (args.length > 1) {
                    replaceString = bu.vars[args[1]];
                } else {
                    replaceString = tagProcessError(fallback, '`Not enough arguments`');
                }
                break;
            case 'set':
                if (args.length > 2) {
                    bu.vars[args[1]] = args[2];
                    bu.emitter.emit('saveVars');
                }
                else if (args.length == 2) {
                    delete bu.vars[args[1]];
                    bu.emitter.emit('saveVars');
                } else {
                    replaceString = tagProcessError(fallback, '`Not enough arguments`');
                }
                break;
            case 'math':
                if (args.length > 2) {
                    var result = tagGetFloat(args[2]);
                    switch (args[1]) {
                        case '+':
                            for (var i = 3; i < args.length; i++) {
                                result += tagGetFloat(args[i]);
                            }
                            break;
                        case '-':
                            for (var i = 3; i < args.length; i++) {
                                result -= tagGetFloat(args[i]);
                            }
                            break;
                        case '*':
                            for (var i = 3; i < args.length; i++) {
                                result *= tagGetFloat(args[i]);
                            }
                            break;
                        case '/':
                            for (var i = 3; i < args.length; i++) {
                                result /= tagGetFloat(args[i]);
                            }
                            break;
                        case '%':
                            for (var i = 3; i < args.length; i++) {
                                result %= tagGetFloat(args[i]);
                            }
                            break;
                    }
                    replaceString = result;
                } else {
                    replaceString = tagProcessError(fallback, '`Not enough arguments`');
                }

                break;
            case 'if':
                if (args.length > 5) {
                    switch (args[1]) {
                        case '==':
                            if (args[2] == args[3])
                                replaceString = args[4]
                            else
                                replaceString = args[5]
                            break;
                        case '!=':
                            if (args[2] != args[3])
                                replaceString = args[4]
                            else
                                replaceString = args[5]
                            break;
                        case '>=':
                            if (args[2] >= args[3])
                                replaceString = args[4]
                            else
                                replaceString = args[5]
                            break;
                        case '<=':
                            if (args[2] <= args[3])
                                replaceString = args[4]
                            else
                                replaceString = args[5]
                            break;
                        case '>':
                            if (args[2] > args[3])
                                replaceString = args[4]
                            else
                                replaceString = args[5]
                            break;
                        case '<':
                            if (args[2] < args[3])
                                replaceString = args[4]
                            else
                                replaceString = args[5]
                            break;
                    }
                } else {
                    replaceString = tagProcessError(fallback, '`Not enough arguments`');
                }
                break;
            case 'lower':
                if (args.length > 1)
                    replaceString = args[1].toLowerCase();
                else
                    replaceString = tagProcessError(fallback, '`Not enough arguments`');

                break;
            case 'upper':
                if (args.length > 1)
                    replaceString = args[1].toUpperCase();
                else
                    replaceString = tagProcessError(fallback, '`Not enough arguments`');

                break;
            case 'username':
                if (args.length == 1) {
                    var obtainedUser = msg.author;
                } else {
                    if (args[2]) {
                        var obtainedUser = bu.getUserFromName(msg, args[1], true);
                    } else {
                        var obtainedUser = bu.getUserFromName(msg, args[1]);
                    }
                }
                if (obtainedUser)
                    replaceString = obtainedUser.username;
                else {
                    if (!args[2])
                        return '';
                    else
                        replaceString = args[1];
                }


                break;
            case 'usernick':
                if (args.length == 1) {
                    var obtainedUser = msg.author;
                } else {
                    if (args[2]) {
                        var obtainedUser = bu.getUserFromName(msg, args[1], true);
                    } else {
                        var obtainedUser = bu.getUserFromName(msg, args[1]);
                    }
                }
                if (obtainedUser) {
                    replaceString = msg.channel.guild.members.get(obtainedUser.id) && msg.channel.guild.members.get(obtainedUser.id).nick
                        ? msg.channel.guild.members.get(obtainedUser.id).nick
                        : obtainedUser.username;
                } else if (!args[2])
                    return '';
                else
                    replaceString = args[1];

                break;
            case 'userdiscrim':
                if (args.length == 1) {
                    var obtainedUser = msg.author;
                } else {
                    if (args[2]) {
                        var obtainedUser = bu.getUserFromName(msg, args[1], true);
                    } else {
                        var obtainedUser = bu.getUserFromName(msg, args[1]);
                    }
                }
                if (obtainedUser)
                    replaceString = obtainedUser.discriminator;

                else if (!args[2])
                    return '';
                else
                    replaceString = args[1];

                break;
            case 'userid':
                if (args.length == 1) {
                    var obtainedUser = msg.author;
                } else {
                    if (args[2]) {
                        var obtainedUser = bu.getUserFromName(msg, args[1], true);
                    } else {
                        var obtainedUser = bu.getUserFromName(msg, args[1]);
                    }
                }
                if (obtainedUser)
                    replaceString = obtainedUser.id;

                else if (!args[2])
                    return '';
                else
                    replaceString = args[1];

                break;
            case 'useravatar':
                if (args.length == 1) {
                    var obtainedUser = msg.author;
                } else {
                    if (args[2]) {
                        var obtainedUser = bu.getUserFromName(msg, args[1], true);
                    } else {
                        var obtainedUser = bu.getUserFromName(msg, args[1]);
                    }
                }
                if (obtainedUser)
                    replaceString = obtainedUser.avatarURL;

                else if (!args[2])
                    return '';
                else
                    replaceString = args[1];
                break;
            case 'userreply':
                if (args.length == 1) {
                    var obtainedUser = msg.author;
                } else {
                    if (args[2]) {
                        var obtainedUser = bu.getUserFromName(msg, args[1], true);
                    } else {
                        var obtainedUser = bu.getUserFromName(msg, args[1]);
                    }
                }
                if (obtainedUser)
                    replaceString = obtainedUser.mention;

                else if (!args[2])
                    return '';
                else
                    replaceString = args[1];

                break;
            case 'usergame':
                if (args.length == 1) {
                    var obtainedUser = msg.author;
                } else {
                    if (args[2]) {
                        var obtainedUser = bu.getUserFromName(msg, args[1], true);
                    } else {
                        var obtainedUser = bu.getUserFromName(msg, args[1]);
                    }
                }
                if (obtainedUser)
                    replaceString = obtainedUser.game ? obtainedUser.game.name : nothing;

                else if (!args[2])
                    return '';
                else
                    replaceString = args[1];

                break;
            case 'usergametype':
                if (args.length == 1) {
                    var obtainedUser = msg.author;
                } else {
                    if (args[2]) {
                        var obtainedUser = bu.getUserFromName(msg, args[1], true);
                    } else {
                        var obtainedUser = bu.getUserFromName(msg, args[1]);
                    }
                }
                if (obtainedUser)
                    replaceString = obtainedUser.game ? (obtainedUser.game.type > 0 ? 'streaming' : 'playing') : '';

                else if (!args[2])
                    return '';
                else
                    replaceString = args[1];

                break;
            case 'usercreatedat':
                if (args.length == 1) {
                    var obtainedUser = msg.author;
                } else {
                    if (args[3]) {
                        var obtainedUser = bu.getUserFromName(msg, args[1], true);
                    } else {
                        var obtainedUser = bu.getUserFromName(msg, args[1]);
                    }
                }
                if (obtainedUser) {
                    var createdDate = obtainedUser.createdAt;
                    var formatCode = '';
                    if (args[2])
                        formatCode = args[2];

                    replaceString = moment(createdDate).format(formatCode);
                }

                else if (!args[3])
                    return '';
                else
                    replaceString = args[1];

                break;
            case 'userjoinedat':
                if (args.length == 1) {
                    var obtainedUser = msg.author;
                } else {
                    if (args[3]) {
                        var obtainedUser = bu.getUserFromName(msg, args[1], true);
                    } else {
                        var obtainedUser = bu.getUserFromName(msg, args[1]);
                    }
                }
                if (obtainedUser) {
                    var createdDate = msg.channel.guild.members.get(obtainedUser.id).joinedAt;
                    var formatCode = '';
                    if (args[2])
                        formatCode = args[2];

                    replaceString = moment(createdDate).format(formatCode);
                } else if (!args[2])
                    return '';
                else
                    replaceString = args[1];
                break;
            case 'guildcreatedat':

                var createdDate = msg.channel.guild.createdAt;
                var formatCode = '';
                if (args[2])
                    formatCode = args[2];

                replaceString = moment(createdDate).format(formatCode);
                break;
            case 'hash':
                if (args[1]) {
                    replaceString = args[1].split("").reduce(function (a, b) {
                        a = ((a << 5) - a) + b.charCodeAt(0);
                        return a & a
                    }, 0);
                }
                else
                    replaceString = tagProcessError(fallback, '`Not enough arguments`');
                break;
            default:
                replaceString = tagProcessError(fallback, '`Tag doesn\'t exist`');
                break;
        }
        replaceString = replaceString.toString();
        //console.log(replaceString);
        if (replaceString.indexOf('{') > -1 && replaceString.indexOf('}') > -1) {
            replaceString = replaceString.replace(/\}/g, '&rb;');
        }
        contents = contents.replace(tagBrackets, replaceString);    
        //console.log(tagBrackets, replaceString, contents);

    }
    contents = contents.replace(/&rb;/g, '}').replace(/&lb;/g, '{');
    while (/<@!?[0-9]{17,21}>/.test(contents)) {
        //console.log('fuck');
        contents = contents.replace(/<@!?[0-9]{17,21}>/, '@' + bu.getUserFromName(msg, contents.match(/<@!?([0-9]{17,21})>/)[1], true).username)
    }
    return contents.trim();
}

function tagGetFloat(arg) {
    return parseFloat(arg) ? parseFloat(arg) : 0;
}

function tagProcessError(fallback, errormessage) {
    return fallback == '' ? errormessage : fallback
}

e.executeTag = (msg, tagName, command) => {
    var stmt = bu.db.prepare(`select contents from tag where title=?`);
    stmt.get(tagName, (err, row) => {
        if (!row)
            bu.sendMessageToDiscord(msg.channel.id, `❌ That tag doesn't exists! ❌`)
        else {
            var nsfw = false;
            if (row.contents.indexOf('{nsfw}') > -1) {
                nsfw = true;
            }
            var message = e.processTag(msg, row.contents, command);
            if (message != '')
                if (!nsfw)
                    bu.sendMessageToDiscord(msg.channel.id, message);
                else {
                    if (bu.config.discord.servers[msg.channel.guild.id] &&
                        bu.config.discord.servers[msg.channel.guild.id].nsfw &&
                        bu.config.discord.servers[msg.channel.guild.id].nsfw[msg.channel.id]) {
                        bu.sendMessageToDiscord(msg.channel.id, message);
                    } else
                        bu.sendMessageToDiscord(msg.channel.id, `❌ This tag contains NSFW content! Go to an NSFW channel. ❌`);
                }

        }
    });
}