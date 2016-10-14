var e = module.exports = {};
var bu;
var Promise = require('promise');
var bot;
const async = require('asyncawait/async');
const await = require('asyncawait/await');

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
    + 'where `number` is the amount of lines to get. You can retrieve a maximum of 1000 logs.'
    + 'For more specific logs, you can specify a (case insensitive) '
    + 'type and parameter as follows:\n'
    + 'Types: \n'
    + '     -TYPE (-T)\n'
    + '        CREATE - Gets original messages.\n'
    + '        UPDATE - Gets message edits.\n'
    + '        DELETE - Gets message deletes.\n'
    + '     -CHANNEL (-C)\n'
    + '        <id> - The channel to get logs from. Must be on the current guild!'
    + '     -USER (-U)\n'
    + '        <name or id> - Gets messages made by specific user.\n'
    + '     -ORDER (-O)\n'
    + '        DESC - Get\'s the newest messages first (default).\n'
    + '        ASC  - Get\'s the oldest messages first.</code></pre></p>'
    + 'For example, if you wanted to get 100 messages `stupid cat` deleted, you would do this:\n'
    + '`logs 100 -message delete -user stupid cat`'
    + 'If you want to use multiple of the same type, separate parameters with commas. For example:\n'
    + '`logs 100 -m create, update -u stupid cat, dumb cat`';
e.longinfo = '<p>DMs you a file with chat logs from the current channel, '
    + 'where `number` is the amount of lines to get. '
    + 'For more specific logs, you can specify a (case insensitive) '
    + 'type and parameter as follows:</p><p>'
    + '<pre><code>Types: \n'
    + '     -TYPE (-T)\n'
    + '        CREATE - Gets original messages.\n'
    + '        UPDATE - Gets message edits.\n'
    + '        DELETE - Gets message deletes.\n'
    + '     -CHANNEL (-C)\n'
    + '        <id> - The channel to get logs from. Must be on the current guild!'
    + '     -USER (-U)\n'
    + '        <name or id> - Gets messages made by specific user.\n'
    + '     -ORDER (-O)\n'
    + '        DESC - Get\'s the newest messages first (default).\n'
    + '        ASC  - Get\'s the oldest messages first.</code></pre></p>'
    + '<p>For example, if you wanted to get 100 messages `stupid cat` deleted, you would do this:<\p>'
    + '<pre><code>logs 100 -message delete -user stupid cat</code></pre>'
    + '<p>If you want to use multiple of the same type, separate parameters with commas. For example:</p>'
    + '<pre><code>logs 100 -m create, update -u stupid cat, dumb cat</code></pre>';

e.execute = async((msg, words) => {
    //  bu.send(msg.channel.id, 'WIP');
    //  return;
    if (words[0].toLowerCase() == 'help') {
        bu.send(msg.channel.id, e.info);
        return;
    }
    let numberOfMessages = NaN
        , type = ''
        , user = ''
        , current
        , order
        , channel = msg.channel.id;
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
            if (words[i].toLowerCase() == '-t' || words[i].toLowerCase() == '-type') {
                current = 0;
                type += ',';
            } else if (words[i].toLowerCase() == '-u' || words[i].toLowerCase() == '-user') {
                current = 1;
                user += ',';
            } else if (words[i].toLowerCase() == '-o' || words[i].toLowerCase() == '-order') {
                current = 2;
            } else if (words[i].toLowerCase() == '-c' || words[i].toLowerCase() == '-channel') {
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
                        if (/^\d*$/.test(words[i]))
                            channel = words[i];
                        break;
                    default:
                        bu.logger.debug('wut');
                        break;
                }
            }
        }
    }
    let guild = bot.channelGuildMap[channel];
    if (!guild || guild != msg.channel.guild.id) {
        bu.send(msg.channel.id, 'The channel must be on this guild!');
        return;
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
            types.push(typeRef[typesRaw[i].toUpperCase().trim()]);
        }
    }

    for (i = 0; i < usersRaw.length; i++) {
        if (usersRaw[i] != '') {
            var name = usersRaw[i].trim();
            var u = await(bu.getUserFromName(msg, name, false));
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
    bu.logger.debug(channel, users, types, order);
    let msg2 = await(bu.send(msg.channel.id, 'Generating your logs...'));
    let msgids = [msg.id, msg2.id];
    let thing = await(bu.r.table('chatlogs')
        .orderBy({ index: order ? bu.r.asc('msgtime') : bu.r.desc('msgtime') })
        .filter(function (q) {
            return q('channelid').eq(channel).and(
                bu.r.expr(users).count().eq(0).or(bu.r.expr(users).contains(q('userid'))))
                .and(bu.r.expr(types).count().eq(0).or(bu.r.expr(types).contains(q('type')))
                .and(bu.r.expr(msgids).contains(q('msgid')).not())
                );
        })
        .limit(numberOfMessages).run());
    let key = await(insertQuery(msg, channel, users, types, thing[thing.length - 1].msgtime, numberOfMessages))
    bot.editMessage(msg2.channel.id, msg2.id, 'Your logs are available here: https://blargbot.xyz/logs/#' + (bu.config.general.isbeta ? 'beta' : '') + key);
});

var insertQuery = async((msg, channel, users, types, firstTime, numberOfMessages) => {
    function attemptInsert() {
        var key = randomString(6);
        bu.logger.debug(key);
        let exists = await(bu.r.table('logs').get('key'));
        if (exists) {
            return attemptInsert;
        }
        await(bu.r.table('logs').insert({
            keycode: key,
            channel: channel,
            users: users,
            types: types,
            firsttime: bu.r.expr(firstTime).toEpochTime(),
            limit: numberOfMessages
        }).run());
        return key;
    }
    return attemptInsert();
});

function randomString(length) {
    return Math.round((Math.pow(36, length + 1) - Math.random() * Math.pow(36, length))).toString(36).slice(1);
}

var typeRef = {
    CREATE: 0,
    UPDATE: 1,
    DELETE: 2
};
