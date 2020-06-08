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
                    desc: 'Removes all your usernames from the database.'
                }
            ]
        });
    }

    async execute(msg, words, text) {
        let input = bu.parseInput(this.flags, words);
        let user;
        if (input.r) {
            user = msg.author;
            let storedUser = bu.getCachedUser(user.id);
            let updatedUser = { usernames: [] };
            if (storedUser.usernames.length > 0 ) {
                await r.table('user').get(user.id).update(updatedUser).run(); 
                return bu.send(msg, `Succesfully removed ${storedUser.usernames.length} username${storedUser.usernames.length > 1 ? 's' : ''}.`);
            } else {
                return bu.send(msg, 'No usernames could be removed!')
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
