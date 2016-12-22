var e = module.exports = {};
const safe = require('safe-regex');

e.init = () => {
    e.category = bu.CommandType.ADMIN;
};

e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = 'tidy [amount] [flags]';
e.info = 'Clears messages from chat. Defaults to 100.';
e.longinfo = `<p>Cleans a number of messages, defaulting to 100.</p>`;

e.flags = [{
    flag: 'b',
    word: 'bots',
    desc: 'Remove messages from bots.'
}, {
    flag: 'i',
    word: 'invites',
    desc: 'Remove messages containing invites.'
}, {
    flag: 'l',
    word: 'links',
    desc: 'Remove messages containing links.'
}, {
    flag: 'e',
    word: 'embeds',
    desc: 'Remove messages containing embeds.'
}, {
    flag: 'a',
    word: 'attachments',
    desc: 'Remove messages containing attachments.'
}, {
    flag: 'u',
    word: 'user',
    desc: 'Removes messages from the users specified, separated by commas.'
}, {
    flag: 'q',
    word: 'query',
    desc: 'Removes messages that match the regex query. You can also use regex.'
}]

e.execute = async function(msg, words) {
    let input = bu.parseInput(e.flags, words);
    let userList;
    let query;
    if (input.q) {
        let queryStr = input.q.join(' ');
        if (/^\/?.*\/.*/.test(queryStr)) {
            regexList = queryStr.match(/^\/?(.*)\/(.*)/);
            query = new RegExp(regexList[1], regexList[2]);
        } else {
            query = new RegExp(queryStr);
        }
        if (!safe(query)) {
            bu.send(msg, 'That regex is not safe! Terminating operation.');
            return;
        }
    }

    if (input.u) {
        let users = input.u.join(' ').split(',');
        userList = [];
        for (let user of users) {
            user = await bu.getUser(msg, user);
            if (user)
                userList.push(user);
        }
        userList = userList.map(u => u.id);
    }

    var limit = 100;
    if (input.undefined.length > 0) {
        limit = parseInt(input.undefined.join(' '));
    }
    if (limit < 0 || isNaN(limit)) limit = 100;
    if (limit > 100) {
        let msg2 = await bu.awaitMessage(msg, `This operation will clear up to ${limit} messages. There is no way to recover them after deletion. Please type 'yes' to continue, or anything else to cancel. This query will expire in 60 seconds.`, undefined, 60000)
        if (msg2.content.toLowerCase() != 'yes') {
            bu.send(msg, 'Tidy canceled.');
            return;
        }
    }
    logger.debug(limit);
    try {
        let num = await bot.purgeChannel(msg.channel.id, limit, message => {
            if (input.b && !message.author.bot) return false;
            if (input.i && !/discord\.gg\/[\d\w]+/.test(message.content)) return false;
            if (input.l && !/https?:\/\/.*\..*/.test(message.content)) return false;
            if (input.e && message.embeds.length == 0) return false;
            if (input.a && message.attachments.length == 0) return false;
            if (userList && userList.length > 0 && !userList.includes(message.author.id)) return false;
            if (input.q && !query.test(message.content)) return false;
            return true;
        });
        let val = await bu.send(msg, `Deleted ${num} messages.`);
        setTimeout(function() {
            bot.deleteMessage(msg.channel.id, val.id).catch(err => logger.error(err));
        }, 5000);
    } catch (err) {
        bu.send(msg, 'I need to be able to Manage Messages to do that!');
        logger.error(err);
    }
};