var e = module.exports = {};
var bu = require('./util.js');
var moment = require('moment-timezone');
var bu = require('./util.js');

var bot;
e.init = (Tbot) => {
    bot = Tbot;
};

e.processTag = (msg, contents, command, tagName, author) => {
    tagName = tagName || msg.channel.guild.id;
    author = author || msg.channel.guild.id;
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
        .replace(/\{rb}/gi, '%RB%')
        .replace(/\{lb}/gi, '%LB%')
        .replace(/\{semi}/g, '%SEMI%');

    var fallback = '';
    while (contents.indexOf('{') > -1 && contents.indexOf('}') > -1 &&
        contents.indexOf('{') < contents.indexOf('}')) {
        var tagEnds = contents.indexOf('}')
            , tagBegins = tagEnds == -1 ? -1 : contents.lastIndexOf('{', tagEnds)
            , tagBrackets = contents.substring(tagBegins, tagEnds + 1)
            , tag = contents.substring(tagBegins + 1, tagEnds)
            , args = tag.split(';')
            , replaceString = ''
            , i
            , obtainedUser
            , formatCode
            , createdDate;

        for (i = 0; i < args.length; i++) {
            args[i] = args[i].replace(/^[\s\n]+|[\s\n]+$/g, '');
        }
        switch (args[0].toLowerCase()) {
            case 'randuser':
                replaceString = msg.channel.guild.members.map(m => m)[bu.getRandomInt(0, msg.channel.guild.members.map(m => m).length - 1)].user.id;
                break;
            case '//':
                break;
            case 'fallback':
                if (args[1])
                    fallback = args[1];
                break;
            case 'randint':
                //console.log(args.length);
                if (args.length == 2) {
                    replaceString = bu.getRandomInt(0, parseInt(args[1]));
                } else if (args.length > 2) {
                    replaceString = bu.getRandomInt(parseInt(args[1]), parseInt(args[2]));
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
                        for (i = min; i < max; i++) {
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
                console.log(words);
                var length = words.length;
                if (length == 1 && words[0] == '') {
                    length = 0;
                }
                replaceString = length;
                break;
            case 'randchoose':
                if (args.length > 1) {
                    //    console.log(util.inspect(args))
                    replaceString = args[bu.getRandomInt(1, args.length - 1)];
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
            case 'shuffle':
                replaceString = '';
                words = shuffle(words);
                break;
            case 'regexreplace':
                var regexList;
                if (args.length > 3) {
                    if (/^\/?.*\/.*/.test(args[2])) {
                        //var
                        regexList = args[2].match(/^\/?(.*)\/(.*)/);
                        replaceString = args[1].replace(new RegExp(regexList[1], regexList[2]), args[3]);
                    } else {
                        replaceString = tagProcessError(fallback, '`Invalid regex string`');
                    }
                } else if (args.length == 3) {
                    if (/^\/?.*\/.*/.test(args[1])) {
                        try {
                            regexList = args[1].match(/^\/?(.*)\/(.*)/);
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
            case 'tget':
                if (!bu.vars[tagName]) {
                    bu.vars[tagName] = {};
                }
                if (args.length > 1) {
                    replaceString = (bu.vars[tagName][args[1]] || 0) + '';
                } else {
                    replaceString = tagProcessError(fallback, '`Not enough arguments`');
                }
                break;
            case 'tset':
                if (!bu.vars[tagName]) {
                    bu.vars[tagName] = {};
                }
                if (args.length > 2) {
                    bu.vars[tagName][args[1]] = args[2];
                    bu.emitter.emit('saveVars');
                }
                else if (args.length == 2) {
                    delete bu.vars[tagName][args[1]];
                    bu.emitter.emit('saveVars');
                } else {
                    replaceString = tagProcessError(fallback, '`Not enough arguments`');
                }
                break;
            case 'get':
                if (!bu.vars[author]) {
                    bu.vars[author] = {};
                }
                if (args.length > 1) {
                    replaceString = (bu.vars[author][args[1]] || 0) + '';
                    
                } else {
                    replaceString = tagProcessError(fallback, '`Not enough arguments`');
                }
                break;
            case 'set':
                if (!bu.vars[author]) {
                    bu.vars[author] = {};
                }
                if (args.length > 2) {
                    bu.vars[author][args[1]] = args[2];
                    bu.emitter.emit('saveVars');
                }
                else if (args.length == 2) {
                    delete bu.vars[author][args[1]];
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
                            for (i = 3; i < args.length; i++) {
                                result += tagGetFloat(args[i]);
                            }
                            break;
                        case '-':
                            for (i = 3; i < args.length; i++) {
                                result -= tagGetFloat(args[i]);
                            }
                            break;
                        case '*':
                            for (i = 3; i < args.length; i++) {
                                result *= tagGetFloat(args[i]);
                            }
                            break;
                        case '/':
                            for (i = 3; i < args.length; i++) {
                                result /= tagGetFloat(args[i]);
                            }
                            break;
                        case '%':
                            for (i = 3; i < args.length; i++) {
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
                                replaceString = args[4];
                            else
                                replaceString = args[5];
                            break;
                        case '!=':
                            if (args[2] != args[3])
                                replaceString = args[4];
                            else
                                replaceString = args[5];
                            break;
                        case '>=':
                            if (args[2] >= args[3])
                                replaceString = args[4];
                            else
                                replaceString = args[5];
                            break;
                        case '<=':
                            if (args[2] <= args[3])
                                replaceString = args[4];
                            else
                                replaceString = args[5];
                            break;
                        case '>':
                            if (args[2] > args[3])
                                replaceString = args[4];
                            else
                                replaceString = args[5];
                            break;
                        case '<':
                            if (args[2] < args[3])
                                replaceString = args[4];
                            else
                                replaceString = args[5];
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
                obtainedUser = getUser(msg, args);

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
                obtainedUser = getUser(msg, args);

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
                obtainedUser = getUser(msg, args);
                if (obtainedUser)
                    replaceString = obtainedUser.discriminator;

                else if (!args[2])
                    return '';
                else
                    replaceString = args[1];

                break;
            case 'userid':
                obtainedUser = getUser(msg, args);

                if (obtainedUser)
                    replaceString = obtainedUser.id;

                else if (!args[2])
                    return '';
                else
                    replaceString = args[1];

                break;
            case 'useravatar':
                obtainedUser = getUser(msg, args);

                if (obtainedUser)
                    replaceString = obtainedUser.avatarURL;

                else if (!args[2])
                    return '';
                else
                    replaceString = args[1];
                break;
            case 'userreply':
                obtainedUser = getUser(msg, args);

                if (obtainedUser)
                    replaceString = obtainedUser.mention;

                else if (!args[2])
                    return '';
                else
                    replaceString = args[1];

                break;
            case 'usergame':
                obtainedUser = getUser(msg, args);

                if (obtainedUser)
                    replaceString = obtainedUser.game ? obtainedUser.game.name : nothing;

                else if (!args[2])
                    return '';
                else
                    replaceString = args[1];

                break;
            case 'usergametype':
                obtainedUser = getUser(msg, args);

                if (obtainedUser)
                    replaceString = obtainedUser.game ? (obtainedUser.game.type > 0 ? 'streaming' : 'playing') : '';

                else if (!args[2])
                    return '';
                else
                    replaceString = args[1];

                break;
            case 'usercreatedat':
                obtainedUser = getUser(msg, args);

                if (obtainedUser) {
                    createdDate = obtainedUser.createdAt;
                    formatCode = '';
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
                obtainedUser = getUser(msg, args);

                if (obtainedUser) {
                    createdDate = msg.channel.guild.members.get(obtainedUser.id).joinedAt;
                    formatCode = '';
                    if (args[2])
                        formatCode = args[2];

                    replaceString = moment(createdDate).format(formatCode);
                } else if (!args[2])
                    return '';
                else
                    replaceString = args[1];
                break;
            case 'guildcreatedat':

                createdDate = msg.channel.guild.createdAt;
                formatCode = '';
                if (args[2])
                    formatCode = args[2];

                replaceString = moment(createdDate).format(formatCode);
                break;
            case 'hash':
                if (args[1]) {
                    replaceString = args[1].split('').reduce(function (a, b) {
                        a = ((a << 5) - a) + b.charCodeAt(0);
                        return a & a;
                    }, 0);
                }
                else
                    replaceString = tagProcessError(fallback, '`Not enough arguments`');
                break;
            default:
                replaceString = tagProcessError(fallback, '`Tag doesn\'t exist`');
                break;
        }
        if (!replaceString) {
            replaceString = '';
        }
        replaceString = replaceString.toString();
        replaceString = replaceString.replace(/\}/gi, '%RB%')
            .replace(/\{/gi, '%LB%')
            .replace(/\;/g, '%SEMI%');
        console.log(tagBrackets, replaceString);
        contents = contents.replace(tagBrackets, replaceString);

    }
    contents = contents.replace(/%RB%/g, '}').replace(/%LB%/g, '{').replace(/%SEMI%/g, ';');
    while (/<@!?[0-9]{17,21}>/.test(contents)) {
        //console.log('fuck');
        contents = contents.replace(/<@!?[0-9]{17,21}>/, '@' + bu.getUserFromName(msg, contents.match(/<@!?([0-9]{17,21})>/)[1], true).username);
    }
    return contents.trim();
};

function tagGetFloat(arg) {
    return parseFloat(arg) ? parseFloat(arg) : 0;
}

function tagProcessError(fallback, errormessage) {
    return fallback == '' ? errormessage : fallback;
}

e.executeTag = (msg, tagName, command) => {
    bu.db.query(`select contents, author from tag where title=?`, [tagName], (err, row) => {
        if (!row[0])
            bu.sendMessageToDiscord(msg.channel.id, `❌ That tag doesn't exists! ❌`);
        else {
            var nsfw = false;
            if (row[0].contents.indexOf('{nsfw}') > -1) {
                nsfw = true;
            }
            var message = e.processTag(msg, row[0].contents, command, tagName, row[0].author);
            if (message != '')
                if (!nsfw)
                    bu.sendMessageToDiscord(msg.channel.id, message);
                else {
                    bu.db.query('select channelid from nsfwchan where channelid = ?', [msg.channel.id], (err, rows) => {
                        if (rows[0]) {
                            bu.sendMessageToDiscord(msg.channel.id, message);

                        } else {
                            bu.sendMessageToDiscord(msg.channel.id, `❌ This tag contains NSFW content! Go to an NSFW channel. ❌`);
                        }
                    });
                }

        }
    });
};


function shuffle(array) {
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
}

function getUser(msg, args) {
    var obtainedUser;
    if (args.length == 1) {
        obtainedUser = msg.author;
    } else {
        if (args[2]) {
            obtainedUser = bu.getUserFromName(msg, args[1], true);
        } else {
            obtainedUser = bu.getUserFromName(msg, args[1]);
        }
    }
    return obtainedUser;
}