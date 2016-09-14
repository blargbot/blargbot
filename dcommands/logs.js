var e = module.exports = {};
var bu = require('./../util.js');
var util = require('util');
var Table = require('cli-table');
var moment = require('moment-timezone');
var bot;
e.init = (Tbot) => {
    bot = Tbot;
};

e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = 'logs <number> [<type> <parameters...>]';
e.info = 'DMs you a file with chat logs from the current channel, '
    + 'where `number` is the amount of lines to get. '
    + 'For more specific logs, you can specify a (case insensitive) '
    + 'type and parameter as follows:\n'
    + 'Types: \n'
    + '     -MESSAGE (-M)\n'
    + '        CREATE - Gets original messages.\n'
    + '        UPDATE - Gets message edits.\n'
    + '        DELETE - Gets message deletes.\n'
    + '     -USER (-U)\n'
    + '        <name or id> - Gets messages made by specific user.\n'
    + '     -ORDER (-O)\n'
    + '        DESC - Get\'s the newest messages first (default).\n'
    + '        ASC  - Get\'s the oldest messages first.\n'
    + 'For example, if you wanted to get 100 messages `stupid cat` deleted, you would do this:\n'
    + '`logs 100 -message delete -user stupid cat`'
    + 'If you want to use multiple of the same type, separate parameters with commas. For example:\n'
    + '`logs 100 -m create, update -u stupid cat, dumb cat`';
e.longinfo = '<p>DMs you a file with chat logs from the current channel, '
    + 'where `number` is the amount of lines to get. '
    + 'For more specific logs, you can specify a (case insensitive) '
    + 'type and parameter as follows:</p><p>'
    + '<pre><code>Types: \n'
    + '     -MESSAGE (-M)\n'
    + '        CREATE - Gets original messages.\n'
    + '        UPDATE - Gets message edits.\n'
    + '        DELETE - Gets message deletes.\n'
    + '     -USER (-U)\n'
    + '        <name or id> - Gets messages made by specific user.\n'
    + '     -ORDER (-O)\n'
    + '        DESC - Get\'s the newest messages first (default).\n'
    + '        ASC  - Get\'s the oldest messages first.</code></pre></p>'
    + '<p>For example, if you wanted to get 100 messages `stupid cat` deleted, you would do this:<\p>'
    + '<pre><code>logs 100 -message delete -user stupid cat</code></pre>'
    + '<p>If you want to use multiple of the same type, separate parameters with commas. For example:</p>'
    + '<pre><code>logs 100 -m create, update -u stupid cat, dumb cat</code></pre>';
e.category = bu.CommandType.ADMIN;

e.execute = (msg, words) => {
    if (words.length > 1) {
        var numberOfMessages = parseInt(words[1])
            , type = ''
            , user = ''
            , current
            , order;
        console.log(util.inspect(words));
        for (var i = 0; i < words.length; i++) {
            console.log(i, words[i]);
            if (i >= 1) {
                //   console.log('fbaoisfs');
                if (words[i].toLowerCase() == '-m' || words[i].toLowerCase() == '-message') {
                    //     console.log('Addings types now');
                    current = 0;
                    type += ',';
                } else if (words[i].toLowerCase() == '-u' || words[i].toLowerCase() == '-user') {
                    //    console.log('Adding users now');
                    current = 1;
                    user += ',';
                } else if (words[i].toLowerCase() == '-o' || words[i].toLowerCase() == '-order') {
                    //    console.log('Adding users now');
                    current = 2;
                } else {
                    console.log(current);
                    switch (current) {
                        case 0: //message
                            //      console.log('type');
                            type += words[i] + ' ';
                            break;
                        case 1: //user
                            //     console.log('user');
                            user += words[i] + ' ';
                            break;
                        case 2:
                            if (words[i].toUpperCase().startsWith('ASC') && order == null) {
                                order = true;
                            } else if (words[i].toUpperCase().startsWith('DESC') && order == null) {
                                order = false;
                            }
                            break;
                        default:
                            console.log('wut');
                            break;
                    }
                }
            }
        }
        if (order == null) {
            order = false;
        }
        console.log(user, type);
        var typesRaw = type.split(',')
            , usersRaw = user.split(',')
            , types = []
            , users = [];
        console.log(util.inspect(typesRaw));
        console.log(util.inspect(usersRaw));
        for (i = 0; i < typesRaw.length; i++) {
            if (typesRaw[i] != '') {
                types.push(typesRaw[i].toUpperCase().trim());
            }
        }

        for (i = 0; i < usersRaw.length; i++) {
            if (usersRaw[i] != '') {
                var name = usersRaw[i].trim();
                var u = bu.getUserFromName(msg, name, false);
                if (!u) {
                    return;
                } else {
                    users.push(u.id);
                }
            }
        }
        console.log(util.inspect(types));
        console.log(util.inspect(users));
        var statement = `select type, content, attachment, userid, mentions, msgid, msgtime from chatlogs where `;
        for (i = 0; i < types.length; i++) {
            statement += `${i == 0 ? '(' : ''}type = ${bu.db.escape(typeRef[types[i]])} ${i < types.length - 1 ? 'or ' : ') and '}`;
        }
        for (i = 0; i < users.length; i++) {
            statement += `${i == 0 ? '(' : ''}userid = ${bu.db.escape(users[i])} ${i < users.length - 1 ? 'or ' : ') and '}`;
        }
        statement += 'channelid = ' + bu.db.escape(msg.channel.id) + '  order by id ' + (order ? 'asc' : 'desc') + (numberOfMessages > 0 && !isNaN(numberOfMessages) ? ' limit ' + bu.db.escape(numberOfMessages) : '');
        console.log(statement);
        bu.db.query(statement, (err, rows) => {
            if (err) {
                console.log(err);
                bu.send(msg.channel.id, `Something went wrong!`);
                return;
            }
            console.log(rows.length);
            var table = new Table({
                head: ['Type', 'Username', 'User ID', 'Message ID', 'Time', 'Content', 'Attachment', 'Mentions']
                //    , colWidths: [9, 30, 25, 25, 100, 40, 40]
            });
            for (i = 0; i < rows.length; i++) {
                console.log(rows[i].msgtime);
                var messageType = rows[i].type == 0
                    ? 'CREATE'
                    : (rows[i].type == 1
                        ? 'UPDATE'
                        : 'DELETE');
                //  var addTo = `${messageType}:\t${bot.users.get(rows[i].userid).username}\t${rows[i].userid}>\t${rows[i].content}\t${rows[i].attachment != 'none' ? `ATTACHMENT: ${rows[i].attachment}\t` : ''}${rows[i].mentions != '' ? `MENTIONS: ${rows[i].mentions}` : ''}\n`;
                //console.log(i, addTo);
                //logString += addTo;
                table.push([messageType
                    , bot.users.get(rows[i].userid) ? bot.users.get(rows[i].userid).username : 'null'
                    , rows[i].userid
                    , rows[i].msgid
                    , moment(rows[i].msgtime).format('lll')
                    , rows[i].content
                    , rows[i].attachment == 'none' ? '' : rows[i].attachment
                    , rows[i].mentions]);
            }
            console.log(table.toString());
            bot.getDMChannel(msg.author.id).then(pc => {
                bu.send(pc.id, `Here are your logs for ${msg.channel.name}!`, {
                    file: 'Note: You may need to disable word wrapping to properly view this file.\nAll timestamps are in UTC time (+0).\nQuery: ' + statement + '\n' + table.toString(),
                    name: `${msg.channel.name} - ${msg.channel.guild.name}.log`
                });
            });

        });
    } else {
        bu.sendMessageToDiscord(msg.channel.id, 'Not enough parameters were given!');
    }
};

var typeRef = {
    CREATE: 0,
    UPDATE: 1,
    DELETE: 2
};