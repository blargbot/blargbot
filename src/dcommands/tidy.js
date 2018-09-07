const BaseCommand = require('../structures/BaseCommand');
const isSafeRegex = require('safe-regex');
const moment = require('moment');

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
            }, {
                flag: 'y',
                word: 'yes',
                desc: 'Bypasses the confirmation'
            }]
        });
    }

    async execute(msg, words, text) {
        let input = bu.parseInput(this.flags, words);
        let userList = [];
        let query;
        let limit = 100;
        if (input.q) {
            let queryStr = input.q.join(' ');
            if (/^\/?.*\/.*/.test(queryStr)) {
                let regexList = queryStr.match(/^\/?(.*)\/(.*)/);
                query = new RegExp(regexList[1], regexList[2]);
            } else {
                query = new RegExp(queryStr);
            }
            if (!isSafeRegex(query)) {
                bu.send(msg, 'That regex is not safe! Terminating operation.');
                return;
            }
        }

        async function parseUsers(users) {
            let result = [];
            for (let user of users) {
                user = await bu.getUser(msg, user);
                if (user)
                    result.push(user);
            }
            return result.map(u => u.id);
        }

        if (input.u) {
            let users = await parseUsers(input.u.join(' ').split(','));
            if (users.length == 0) {
                await bu.send(msg, 'No users were found.');
                return;
            } else {
                userList.push(...users);
            }
        }

        if (input.undefined[0]) {
            limit = parseInt(input.undefined[0]);
            if (limit <= 0 || isNaN(limit)) {
                await bu.send(msg, `Cannot tidy '${input.undefined[0]}' messages`);
                return;
            }
        }

        if (input.undefined[1]) {
            let users = await parseUsers(input.undefined.slice(1).join(' ').split(','));
            userList.push(...users);
        }

        function filter(message) {
            let verdict = true;
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
            }
            return verdict;
        }

        let messages = (await bu.findMessages(msg.channel.id, 200, filter, msg.id)).slice(0, limit);
        messages = messages.filter(m => {
            let diff = moment.duration(moment() - m.timestamp);
            return diff.asDays() < 14;
        });
        let summary = messages.reduce((accumulator, message) => {
            if (!accumulator[message.author.id]) {
                accumulator[message.author.id] = {
                    user: message.author,
                    count: 0
                };
            }
            accumulator[message.author.id].count++;
            return accumulator;
        }, {});
        summary = Object.keys(summary)
            .map(id => summary[id])
            .map(entry => `${entry.user.username}#${entry.user.discriminator} - ${entry.count}`)
            .join('\n');

        let response, prompt;
        if (!input.y) {
            prompt = await bu.createPrompt(msg,
                `You are about to delete ${messages.length} messages by\n**${summary}**\n\n Type \`yes\` to confirm or anything else to cancel.`,
                null, 60000);
            response = await prompt.response || {};
        };
        if (!response || bu.parseBoolean(response.content)) {
            try {
                messages.push(msg);
                if (prompt && response) messages.push(prompt, response);
                await bot.deleteMessages(msg.channel.id,
                    messages.map(m => m.id),
                    `'${msg.content}' by ${msg.author.username}#${msg.author.discriminator}`);
                await bu.send(msg, `Deleted ${messages.length} messages by \n**${summary}**`);
            } catch (err) {
                console.error(err);
                await bu.send(msg, 'I need to be able to Manage Messages to do that!');
            }
        } else {
            await bu.send(msg, 'Tidy cancelled.');
        }
    }
}

module.exports = TidyCommand;
