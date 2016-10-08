var e = module.exports = {};
var bu;
var Promise = require('promise');
var bot;
e.init = (Tbot, blargutil) => {
    bot = Tbot;
    bu = blargutil;


    e.category = bu.CommandType.ADMIN;
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

e.execute = (msg, words) => {
    var numberOfMessages = NaN
        , type = ''
        , user = ''
        , current
        , order;
    if (words.length > 1) {
        numberOfMessages = parseInt(words[1]);
    }

    for (var i = 0; i < words.length; i++) {
        if (i >= 1) {
            if (words[i].toLowerCase() == '-m' || words[i].toLowerCase() == '-message') {
                current = 0;
                type += ',';
            } else if (words[i].toLowerCase() == '-u' || words[i].toLowerCase() == '-user') {
                current = 1;
                user += ',';
            } else if (words[i].toLowerCase() == '-o' || words[i].toLowerCase() == '-order') {
                current = 2;
            } else {
                switch (current) {
                    case 0: //message
                        type += words[i] + ' ';
                        break;
                    case 1: //user
                        user += words[i] + ' ';
                        break;
                    case 2: //order
                        if (words[i].toUpperCase().startsWith('ASC') && order == null) {
                            order = true;
                        } else if (words[i].toUpperCase().startsWith('DESC') && order == null) {
                            order = false;
                        }
                        break;
                    default:
                        bu.logger.debug('wut');
                        break;
                }
            }
        }
    }
    if (order == null) {
        order = false;
    }
    var typesRaw = type.split(',')
        , usersRaw = user.split(',')
        , types = []
        , users = [];
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
                if (/[0-9]{17,21}/.test(usersRaw[i])) {
                    users.push(usersRaw[i].match(/([0-9]{17,21})/)[1]);
                }
            } else {
                users.push(u.id);
            }
        }
    }
    var statementPrefix = 'select type, content, attachment, chatlogs.userid, mentions, msgid, msgtime, username from ';
    var statementFrom = 'chatlogs inner join user on chatlogs.userid = user.userid ';
    var statementWhere = `where channelid = ${bu.db.escape(msg.channel.id)} `;
    var statementEnd = 'order by id ' + (order ? 'asc' : 'desc')
        + (!isNaN(numberOfMessages) && numberOfMessages > 0
            ? ' limit ' + bu.db.escape(numberOfMessages) : '');
    for (i = 0; i < types.length; i++) {
        statementWhere += ` ${i == 0 ? ' and (' : ' or '}type = ${bu.db.escape(typeRef[types[i]])} ${i < types.length - 1 ? ' ' : ') '}`;
    }
    for (i = 0; i < users.length; i++) {
        statementWhere += ` ${i == 0 ? ' and (' : ' or '}chatlogs.userid = ${bu.db.escape(users[i])} ${i < users.length - 1 ? ' ' : ') '}`;
    }
    var IDStatement = `select id from (select id from chatlogs ${statementWhere} ${statementEnd}) as lastid order by id asc limit 1`;
    bu.db.query(IDStatement, (err, rows) => {
        if (rows && rows[0]) {

            statementWhere += 'and id >= ' + bu.db.escape(rows[0].id);
            var statement = `${statementPrefix} ${statementFrom} ${statementWhere} ${statementEnd.replace('desc', 'asc')}`;
            insertQuery(msg, statement).then(key => {
                bu.send(msg.channel.id, 'Your logs are available here: https://blargbot.xyz/logs/#' + key);
                return key;
            }).catch(err => {
                bu.send(msg.channel.id, 'Something went wrong! Please report this error with the `suggest` command:\n```\n' + err.stack + '\n```');
                bu.logger.error(err.stack);
            });
        } else {
            bu.send(msg.channel.id, 'No results found.');

        }
    });
};

function insertQuery(msg, statement) {
    return new Promise((fulfill, reject) => {
        function attemptInsert() {
            var key = randomString(6);
            bu.logger.debug(key);
            bu.db.query('select keycode from logs where keycode = ?', [key], (err, rows) => {
                if (err) {
                    reject(err);
                    return;
                }
                if (rows && rows[0]) {
                    attemptInsert();
                    return;
                } else {
                    bu.db.query(`insert into logs (keycode, statement, channelid) values (?, ?, ?)`, [key, statement, msg.channel.id], (err) => {
                        if (err) {
                            reject(err);
                            return;
                        }
                        fulfill(key);
                    });
                }
            });
        }
        attemptInsert();
    });
}

function randomString(length) {
    return Math.round((Math.pow(36, length + 1) - Math.random() * Math.pow(36, length))).toString(36).slice(1);
}

var typeRef = {
    CREATE: 0,
    UPDATE: 1,
    DELETE: 2
};
