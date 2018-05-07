const BaseCommand = require('../structures/BaseCommand');

class WarnCommand extends BaseCommand {
    constructor() {
        super({
            name: 'warn',
            category: bu.CommandType.ADMIN,
            usage: 'warn <user> [flags]',
            info: 'Issues a warning.\nIf mod-logging is enabled, the warning will be logged.\nIf `kickat` and `banat` have been set using the `settings` command, the target could potentially get banned or kicked.',
            flags: [{
                flag: 'r',
                word: 'reason',
                desc: 'The reason for the warning.'
            },
            {
                flag: 'c',
                word: 'count',
                desc: 'The number of warnings that will be issued.'
            }]
        });
    }

    async execute(msg, words, text) {
        let input = bu.parseInput(this.flags, words);
        if (input.undefined.length == 0) {
            bu.send(msg, 'Not enough input. Do `b!help warn` for usage instructions.');
            return;
        }
        let user = await bu.getUser(msg, input.undefined.join(' '));
        if (!user) return;
        let count = 1;
        if (input.c && input.c.length > 0) {
            let tempCount = parseInt(input.c[0]);
            if (!isNaN(tempCount)) count = tempCount;
        }
        let res = await bu.issueWarning(user, msg.guild, count);
        await bu.logAction(msg.guild, user, msg.author, 'Warning', input.r, bu.ModLogColour.WARN, [{
            name: 'Warnings',
            value: `Assigned: ${count}\nNew Total: ${res.count || 0}`,
            inline: true
        }]);
        bu.send(msg, `:ok_hand: **${bu.getFullName(user)}** has been given ${count == 1 ? 'a warning' : count + ' warnings'}. They now have ${res.count} warning${res.count == 1 ? '' : 's'}.`);
    }
}

module.exports = WarnCommand;
