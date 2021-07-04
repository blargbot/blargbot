const BaseCommand = require('../structures/BaseCommand');
const { parse, commandTypes, modlogColours } = require('../newbu');

class PardonCommand extends BaseCommand {
    constructor() {
        super({
            name: 'pardon',
            category: commandTypes.ADMIN,
            usage: 'pardon <user> [flags]',
            info: 'Pardons a user.\nIf mod-logging is enabled, the pardon will be logged.\nThis will not unban users.',
            flags: [
                { flag: 'r', word: 'reason', desc: 'The reason for the pardon.' },
                {
                    flag: 'c',
                    word: 'count',
                    desc: 'The number of warnings that will be removed.'
                }
            ]
        });
    }

    async execute(msg, words) {
        let input = parse.flags(this.flags, words);
        if (input.undefined.length == 0) {
            bu.send(msg, 'Not enough input. Do `b!help pardon` for usage instructions.');
            return;
        }
        let user = await bu.getUser(msg, input.undefined.join(' '));
        if (!user) return;
        let count = 1;
        if (input.c && input.c.length > 0) {
            let tempCount = parseInt(input.c[0]);
            if (!isNaN(tempCount)) count = tempCount;
        }
        let res = await bu.issuePardon(user, msg.guild, count);
        await bu.logAction(msg.guild, user, msg.author, 'Pardon', input.r, modlogColours.PARDON, [{
            name: 'Pardons',
            value: `Assigned: ${count}\nNew Total: ${res || 0}`,
            inline: true
        }]);
        bu.send(msg, `:ok_hand: **${bu.getFullName(user)}** has been given ${count == 1 ? 'a pardon' : count + ' pardons'}. They now have ${res} warnings.`);
    }
}

module.exports = PardonCommand;
