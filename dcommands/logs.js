var e = module.exports = {};





e.init = () => {




    e.category = bu.CommandType.ADMIN;
};
e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = 'logs <number> [<type> <parameters...>]';
e.info = 'Creates a chatlog page for a specified channel, ' +
    'where `number` is the amount of lines to get. You can retrieve a maximum of 1000 logs.' +
    'For more specific logs, you can specify a (case insensitive) ' +
    'type and parameter as follows:\n' +
    'Types: \n' +
    '     -TYPE (-T)\n' +
    '        CREATE - Gets original messages.\n' +
    '        UPDATE - Gets message edits.\n' +
    '        DELETE - Gets message deletes.\n' +
    '     -CHANNEL (-C)\n' +
    '        <id | mention> - The channel to get logs from. Must be on the current guild!\n' +
    '     -USER (-U)\n' +
    '        <name or id> - Gets messages made by specific user.\n' +
    '     -ORDER (-O)\n' +
    '        DESC - Get\'s the newest messages first (default).\n' +
    '        ASC  - Get\'s the oldest messages first.\n' +
    'For example, if you wanted to get 100 messages `stupid cat` deleted, you would do this:\n' +
    '`logs 100 -message delete -user stupid cat`' +
    'If you want to use multiple of the same type, separate parameters with commas. For example:\n' +
    '`logs 100 -m create, update -u stupid cat, dumb cat`';
e.longinfo = '<p>Creates a chatlog page for a specified channel, ' +
    'where `number` is the amount of lines to get. ' +
    'For more specific logs, you can specify a (case insensitive) ' +
    'type and parameter as follows:</p><p>' +
    '<pre><code>Types: \n' +
    '     -TYPE (-T)\n' +
    '        CREATE - Gets original messages.\n' +
    '        UPDATE - Gets message edits.\n' +
    '        DELETE - Gets message deletes.\n' +
    '     -CHANNEL (-C)\n' +
    '        <id> - The channel to get logs from. Must be on the current guild!\n' +
    '     -USER (-U)\n' +
    '        <name or id> - Gets messages made by specific user.\n' +
    '     -ORDER (-O)\n' +
    '        DESC - Get\'s the newest messages first (default).\n' +
    '        ASC  - Get\'s the oldest messages first.</code></pre></p>' +
    '<p>For example, if you wanted to get 100 messages `stupid cat` deleted, you would do this:<\p>' +
    '<pre><code>logs 100 -message delete -user stupid cat</code></pre>' +
    '<p>If you want to use multiple of the same type, separate parameters with commas. For example:</p>' +
    '<pre><code>logs 100 -m create, update -u stupid cat, dumb cat</code></pre>';


var typeRef = {
    CREATE: 0,
    UPDATE: 1,
    DELETE: 2
};


e.execute = async function(msg, words) {
    //  bu.send(msg, 'WIP');
    //  return;
    if (words[0].toLowerCase() == 'help') {
        bu.send(msg, e.info);
        return;
    }
    let numberOfMessages = NaN,
        type = '',
        user = '',
        current, order, channel = msg.channel.id;
    if (words.length > 1) {
        numberOfMessages = parseInt(words[1]);
    }
    if (isNaN(numberOfMessages) || numberOfMessages > 1000)
        numberOfMessages = 1000;
    if (numberOfMessages <= 0) {
        numberOfMessages = 1;
    }


    for (var i = 0; i < words.length; i++) {
        if (i >= 1) {
            if (words[i].toLowerCase() == '-t' || words[i].toLowerCase() == '-type' || words[i].toLowerCase() == '--type') {
                current = 0;
                type += ',';
            } else if (words[i].toLowerCase() == '-u' || words[i].toLowerCase() == '-user' || words[i].toLowerCase() == '--user') {
                current = 1;
                user += ',';
            } else if (words[i].toLowerCase() == '-o' || words[i].toLowerCase() == '-order' || words[i].toLowerCase() == '--order') {
                current = 2;
            } else if (words[i].toLowerCase() == '-c' || words[i].toLowerCase() == '-channel' || words[i].toLowerCase() == '--channel') {
                current = 3;
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
                    case 3:
                        if (/(\d+)/.test(words[i]))
                            channel = words[i].match(/(\d+)/)[1];
                        break;
                    default:
                        logger.debug('wut');
                        break;
                }
            }
        }
    }
    let guild = bot.channelGuildMap[channel];
    if (!guild || guild != msg.channel.guild.id) {
        bu.send(msg, 'The channel must be on this guild!');
        return;
    }
    if (order == null) {
        order = false;
    }
    var typesRaw = type.split(','),
        usersRaw = user.split(','),
        types = [],
        users = [];
    for (i = 0; i < typesRaw.length; i++) {
        if (typesRaw[i] != '') {
            types.push(typeRef[typesRaw[i].toUpperCase().trim()]);
        }
    }

    for (i = 0; i < usersRaw.length; i++) {
        if (usersRaw[i] != '') {
            var name = usersRaw[i].trim();
            var u = await bu.getUser(msg, name, false);
            if (!u) {
                if (/[0-9]{17,21}/.test(usersRaw[i])) {
                    users.push(usersRaw[i].match(/([0-9]{17,21})/)[1]);
                }
            } else {
                users.push(u.id);
            }
        }
    }
    //if (types.length == 0) {
    //    types = [0, 1, 2];
    // }
    logger.debug(channel, users, types, order);
    let msg2 = await bu.send(msg, 'Generating your logs...');
    let pingUser = false;
    let timer = setTimeout(() => {
        msg2.edit('Generating your logs...\nThis seems to be taking longer than usual. I\'ll ping you when I\'m finished.');
        pingUser = true;
    }, 10000);
    let msgids = [msg.id, msg2.id];
    let thing = await r.table('chatlogs')
        .between([channel, r.epochTime(0)], [channel, r.now()], {
            index: 'channel_time'
        })
        .orderBy({
            index: order ? r.asc('channel_time') : r.desc('channel_time')
        })
        .filter(function(q) {
            return r.expr(users).count().eq(0).or(r.expr(users).contains(q('userid')))
                .and(r.expr(types).count().eq(0).or(r.expr(types).contains(q('type')))
                    .and(r.expr(msgids).contains(q('msgid')).not())
                );
        })
        .limit(numberOfMessages).run();
    if (thing.length == 0) {
        clearTimeout(timer);
        bot.editMessage(msg2.channel.id, msg2.id, 'No results found!');
    } else {
        clearTimeout(timer);
        let key = await insertQuery(msg, channel, users, types, thing[thing.length - 1].msgtime, numberOfMessages);
        let toSend = 'Your logs are available here: https://blargbot.xyz/logs/#' + (config.general.isbeta ? 'beta' : '') + key;
        if (pingUser) {
            toSend = `Sorry that took so long, ${msg.author.mention}!\n${toSend}`;
            await bu.send(msg, toSend);
        } else
            await bot.editMessage(msg2.channel.id, msg2.id, toSend);

    }
};

var insertQuery = async function(msg, channel, users, types, firstTime, numberOfMessages) {
    async function attemptInsert() {
        var key = randomString(6);
        logger.debug(key);
        let exists = await r.table('logs').get(key);
        if (exists) {
            return attemptInsert;
        }
        await r.table('logs').insert({
            keycode: key,
            channel: channel,
            users: users,
            types: types,
            firsttime: r.expr(firstTime),
            lasttime: r.now(),
            limit: numberOfMessages
        }).run();
        return key;
    }
    return attemptInsert();
};

function randomString(length) {
    return Math.round((Math.pow(36, length + 1) - Math.random() * Math.pow(36, length))).toString(36).slice(1);
}