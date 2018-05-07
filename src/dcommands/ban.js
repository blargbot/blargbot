const BaseCommand = require('../structures/BaseCommand');

class BanCommand extends BaseCommand {
    constructor() {
        super({
            name: 'ban',
            category: bu.CommandType.ADMIN,
            usage: 'ban <user> [days] [flags]',
            info: 'Bans a user, where `days` is the number of days to delete messages for (defaults to 1).\nIf mod-logging is enabled, the ban will be logged.',
            flags: [{ flag: 'r', word: 'reason', desc: 'The reason for the ban.' },
            {
                flag: 't',
                word: 'time',
                desc: 'If provided, the user will be unbanned after the period of time. (softban)'
            }]
        });
    }

    async execute(msg, words, text) {
        if (words[1]) {
            let input = bu.parseInput(this.flags, words);

            var user = await bu.getUser(msg, input.undefined[0]);
            if (!user) {
                bu.send(msg, `I couldn't find that user. Try using \`hackban\` with their ID or a mention instead.`);
                return;
            }
            let member = msg.guild.members.get(user.id);
            if (!member) {
                bu.send(msg, `That user isn't on this guild. Try using \`hackban\` with their ID or a mention instead.`);
                return;
            }
            let duration;
            if (input.t && input.t.length > 0) {
                duration = bu.parseDuration(input.t.join(' '));
            }
            bu.send(msg, (await e.ban(msg, user, parseInt(input.undefined.length > 1 ? input.undefined[input.undefined.length - 1] : 0), input.r, duration))[0]);
        } else bu.send(msg, 'You have to tell me who to ban!');
    }
}

module.exports = BanCommand;
