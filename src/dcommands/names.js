const BaseCommand = require('../structures/BaseCommand');
const moment = require('moment-timezone');

class NamesCommand extends BaseCommand {
    constructor() {
        super({
            name: 'names',
            category: bu.CommandType.GENERAL,
            usage: 'names [user] [flags]',
            info: 'Returns the names that I\'ve seen the specified user have in the past 30 days.',
            flags: [
                {
                    flag: 'a',
                    word: 'all',
                    desc: 'Gets all the names.'
                },
                {
                    flag: 'v',
                    word: 'verbose',
                    desc: 'Gets more information about the retrieved names.'
                },
                {
                    flag: 'r',
                    word: 'remove',
                    desc: 'Removes the specified username from the database, or all usernames if used with the `all` flag.'
                },
                {
                    flag: 'y',
                    word: 'yes',
                    desc: 'Bypasses the confirmation when removing usernames.'
                }
            ]
        });
    }

    async execute(msg, words, text) {
        let input = bu.parseInput(this.flags, words);
        let user;
        if (input.r) {
            user = msg.author;
            let storedUser = await bu.getCachedUser(user.id);
            if (!storedUser.usernames || storedUser.usernames.length == 0)
                return bu.send(msg, 'You have no usernames to remove!');
            if (input.a || input.r.length > 0) {
                let prompt, response, name;
                if (!input.a)
                    name = input.r.join(' ');
                let filteredUserNames = input.a ? [] : storedUser.usernames.filter(u => !(u.name.toLowerCase().includes(name)));

                if (filteredUserNames.length === storedUser.usernames.length)
                    return bu.send(msg, `No usernames found!`);

                if (!input.y) {
                    prompt = await bu.createPrompt(msg, `Are you sure you want to remove ${storedUser.usernames.length - filteredUserNames.length} username${storedUser.usernames.length - filteredUserNames.length > 1 ? 's' : ''}?` +
                        `\nType \`yes\` or anything else to cancel`, null, 60000);
                    response = await prompt.response || {};
                }
                if ((response && bu.parseBoolean(response.content)) || input.y) {
                    await r.table('user').get(user.id).update({usernames : filteredUserNames}).run();
                    await bu.send(msg, `Succesfully removed ${storedUser.usernames.length - filteredUserNames.length} username${storedUser.usernames.length - filteredUserNames.length > 1 ? 's' : ''}.`);
                } else {
                    await bu.send(msg, `OK, not removing your usernames!`);
                }
                if (prompt.prompt)
                    await bot.deleteMessage(prompt.prompt.channel.id, prompt.prompt.id);
                return;
            } else if (input.r.length === 0) {
                let matches = storedUser.usernames.map((u, i) => { return { content: u.name, value: i }; });
                let lookup = await bu.createLookup(msg, 'username', matches);
                if (!lookup)
                    return;
                let removedUsername = storedUser.usernames.splice(lookup, 1)[0];
                await r.table('user').get(user.id).update(storedUser).run();
                return bu.send(msg, `Succesfully removed username **${removedUsername}**!`);
            }
        }
        if (input.undefined.length == 0) {
            user = msg.author;
        } else {
            user = await bu.getUser(msg, input.undefined.join(' '));
        }
        if (!user) return;

        let storedUser = await bu.getCachedUser(user.id);
        if (!storedUser) storedUser = { usernames: [] };
        let usernames = storedUser.usernames;

        let output = `Usernames for **${bu.getFullName(user)}**`;
        if (!input.a) {
            usernames = usernames.filter(n => {
                return moment.duration(Date.now() - n.date).asDays() < 30;
            });
            output += ' in the last 30 days';
        }
        output += ':\n';

        if (input.v) {
            usernames = usernames.map(n => {
                return `${n.name} - ${moment(n.date).format('llll')}`;
            });
        } else {
            usernames = usernames.map(n => {
                return n.name;
            });
        }
        if (usernames.length > 0) {
            let i = 0;
            for (const username of usernames) {
                let temp = output;
                if (input.v) {
                    temp += username + ' \n';
                } else {
                    temp += username + ', ';
                }
                if (temp.length > 1800) {
                    output = output.substring(0, output.length - 2);
                    output += `\n...and ${usernames.length - i} more!  `;
                    break;
                }
                output = temp;
                i++;
            }
            output = output.substring(0, output.length - 2);
        } else {
            output += 'No usernames found.';
        }
        await bu.send(msg, output);
    }
}

module.exports = NamesCommand;
