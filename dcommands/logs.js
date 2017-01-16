var e = module.exports = {};

e.init = () => {
    e.category = bu.CommandType.ADMIN;
};

e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = 'logs <number> [flags]';
e.info = 'Creates a chatlog page for a specified channel, ' +
    'where `number` is the amount of lines to get. You can retrieve a maximum of 1000 logs.' +
    'For more specific logs, you can specify flags.\n' +
    'For example, if you wanted to get 100 messages `stupid cat` deleted, you would do this:\n' +
    '`logs 100 --type delete --user stupid cat`' +
    'If you want to use multiple of the same type, separate parameters with commas or chain them together. For example:\n' +
    '`logs 100 -CU -u stupid cat, dumb cat`';
e.longinfo = '<p>Creates a chatlog page for a specified channel, ' +
    'where `number` is the amount of lines to get. ' +
    'For more specific logs, you can specify flags.\n ' +
    '<p>For example, if you wanted to get 100 messages `stupid cat` deleted, you would do this:<\p>' +
    '<pre><code>logs 100 --type delete --user stupid cat</code></pre>' +
    '<p>If you want to use multiple of the same type, separate parameters with commas or chain them together. For example:</p>' +
    '<pre><code>logs 100 -CU -u stupid cat, dumb cat</code></pre>';

e.flags = [{
    flag: 't',
    word: 'type',
    desc: 'The type(s) of message. Value can be CREATE, UPDATE, and/or DELETE, separated by commas.'
}, {
    flag: 'c',
    word: 'channel',
    desc: 'The channel to retrieve logs from. Value can be a channel ID or a channel mention.'
}, {
    flag: 'u',
    word: 'user',
    desc: 'The user(s) to retrieve logs from. Value can be a username, nickname, mention, or ID. This uses the user lookup system.'
}, {
    flag: 'o',
    word: 'order',
    desc: 'The order of logs. Value can be DESC (get newest messages first) or ASC (get oldest messages first).'
}, {
    flag: 'C',
    word: 'create',
    desc: 'Get message creates.'
}, {
    flag: 'U',
    word: 'update',
    desc: 'Get message updates.'
}, {
    flag: 'D',
    word: 'delete',
    desc: 'Get message deletes.'
}, {
    flag: 'j',
    word: 'json',
    desc: 'Returns the logs in a json file rather than on a webpage.'
}]

var typeRef = {
    CREATE: 0,
    UPDATE: 1,
    DELETE: 2
};

e.execute = async function(msg, words) {
    const storedGuild = await bu.getGuild(msg.guild.id);
    if (!storedGuild.settings.makelogs) {
        bu.send(msg, `This guild has not opted into chatlogs. Please do \`b!settings makelogs true\` to allow me to start creating chatlogs.`);
        return;
    }
    if (words[0].toLowerCase() == 'help') {
        bu.send(msg, e.info);
        return;
    }
    let input = bu.parseInput(e.flags, words);
    let numberOfMessages = NaN,
        current, order, channel = msg.channel.id;
    if (input.undefined.length > 0) {
        numberOfMessages = parseInt(input.undefined[0]);
    }
    if (isNaN(numberOfMessages) || numberOfMessages > 1000)
        numberOfMessages = 1000;
    if (numberOfMessages <= 0) {
        numberOfMessages = 1;
    }

    if (input.c && input.c.length > 0)
        if (/(\d+)/.test(input.c[0]))
            channel = input.c[0].match(/(\d+)/)[1];
    let guild = bot.channelGuildMap[channel];
    if (!guild || guild != msg.channel.guild.id) {
        bu.send(msg, 'The channel must be on this guild!');
        return;
    }
    if (input.o && input.o.length > 0)
        if (input.o[0].startsWith('ASC') && order == null) {
            order = true;
        } else if (input.o[0].toUpperCase().startsWith('DESC') && order == null) {
        order = false;
    }
    if (order == null) {
        order = false;
    }
    let user = '',
        type = '';
    if (input.t) type = input.t.join(' ');
    if (input.u) user = input.u.join(' ');
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
    if (input.C && !types.includes(0)) types.push(0);
    if (input.U && !types.includes(1)) types.push(1);
    if (input.D && !types.includes(2)) types.push(2);

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
        if (input.j) {
            let toSend = `${pingUser ? 'Sorry that took so long, ' + msg.author.mention : ''}Here are your logs, in a JSON file!`;
            await bu.send(msg, toSend, {
                file: JSON.stringify(thing, null, 2),
                name: `${msg.channel.id}-logs.json`
            });
            return;
        }
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