const BaseCommand = require('../structures/BaseCommand');

class TidyCommand extends BaseCommand {
    constructor() {
        super({
            name: 'tidy',
            category: bu.CommandType.ADMIN,
            usage: 'tidy [amount] [flags]',
            info: 'Clears messages from chat. Defaults to 100.',
            flags: [{ flag: 'b', word: 'bots', desc: 'Remove messages from bots.' },
            {
                flag: 'i',
                word: 'invites',
                desc: 'Remove messages containing invites.'
            },
            {
                flag: 'l',
                word: 'links',
                desc: 'Remove messages containing links.'
            },
            {
                flag: 'e',
                word: 'embeds',
                desc: 'Remove messages containing embeds.'
            },
            {
                flag: 'a',
                word: 'attachments',
                desc: 'Remove messages containing attachments.'
            },
            {
                flag: 'u',
                word: 'user',
                desc: 'Removes messages from the users specified, separated by commas.'
            },
            {
                flag: 'q',
                word: 'query',
                desc: 'Removes messages that match the provided query. You can also use /regex/.'
            },
            {
                flag: 'I',
                word: 'invert',
                desc: 'Reverses the effects of all the flag filters.'
            }]
        });
    }

    async execute(msg, words, text) {
        let input = bu.parseInput(this.flags, words);
        let userList;
        let query;
        if (input.q) {
            let queryStr = input.q.join(' ');
            if (/^\/?.*\/.*/.test(queryStr)) {
                let regexList = queryStr.match(/^\/?(.*)\/(.*)/);
                query = new RegExp(regexList[1], regexList[2]);
            } else {
                query = new RegExp(queryStr);
            }
            if (!dep.safe(query)) {
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
            if (userList.length == 0) {
                await bu.send(msg, 'No users were found.');
                return;
            }
        }

        var limit = 100;
        if (input.undefined.length > 0) {
            limit = parseInt(input.undefined.join(' '));
        }
        if (limit < 0 || isNaN(limit)) limit = 100;
        if (limit > 100) {
            let msg2 = await bu.awaitMessage(msg, `This operation will clear up to ${limit} messages. There is no way to recover them after deletion. Please type 'yes' to continue, or anything else to cancel. This query will expire in 60 seconds.`, undefined, 60000);
            if (msg2.content.toLowerCase() != 'yes') {
                bu.send(msg, 'Tidy canceled.');
                return;
            }
        }
        console.debug(limit);
        try {
            let deleted = {
                total: 0
            };
            let num = await bot.purgeChannel(msg.channel.id, limit * 2 < 200 ? 200 : limit * 2, message => {
                let verdict = true;
                if (deleted.total == limit) return false;
                if (message.id == msg.id) return true;
                if (input.b && !message.author.bot) verdict = false;
                if (input.i && !/discord\.gg\/[\d\w]+/.test(message.content)) verdict = false;
                if (input.l && !/https?:\/\/.*\..*/.test(message.content)) verdict = false;
                if (input.e && message.embeds.length == 0 && message.attachments.length == 0) verdict = false;
                if (input.a && message.attachments.length == 0) verdict = false;
                if (userList && userList.length > 0 && !userList.includes(message.author.id)) verdict = false;
                if (input.q && !query.test(message.content)) verdict = false;
                if (input.I) verdict = !verdict;
                if (verdict === true) {
                    if (bu.commandMessages[message.channel.guild.id]) {
                        let index = bu.commandMessages[message.channel.guild.id].indexOf(message.id);
                        if (index > -1) {
                            bu.commandMessages[message.guild.id].splice(index, 1);
                        }
                    }
                    deleted.total++;
                    if (!deleted[message.author.id]) deleted[message.author.id] = 0;
                    deleted[message.author.id]++;
                }
                return verdict;
            });
            let output = '';
            for (const key of Object.keys(deleted)) {
                if (key != 'total') {
                    let user = await bu.getUser(msg, key, false);
                    output += `  **${user.username}#${user.discriminator}** - ${deleted[key]}\n`;
                }
            }
            let val;
            if (deleted.total > 0)
                val = await bu.send(msg, `Deleted ${deleted.total} messages.\n\n__Breakdown__:\n${output}`);
            else
                val = await bu.send(msg, `No messages were deleted.`);

            //   setTimeout(function() {
            //       bot.deleteMessage(msg.channel.id, val.id).catch(err => console.error(err));
            //    }, 5000);
        } catch (err) {
            bu.send(msg, 'I need to be able to Manage Messages to do that!');
            console.error(err);
        }
    }
}

module.exports = TidyCommand;
