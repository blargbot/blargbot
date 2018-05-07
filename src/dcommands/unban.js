const BaseCommand = require('../structures/BaseCommand');

class UnbanCommand extends BaseCommand {
    constructor() {
        super({
            name: 'unban',
            category: bu.CommandType.ADMIN,
            usage: 'unban <userid> [flags]',
            info: 'Unbans a user.\nIf mod-logging is enabled, the unban will be logged.',
            flags: [{ flag: 'r', word: 'reason', desc: 'The reason for the unban.' }]
        });
    }

    async execute(msg, words, text) {
        let input = bu.parseInput(this.flags, words);
        if (input.undefined.length > 0) {
            var user = input.undefined.join(' ').match(/(\d+)/)[1];
            if (!user) {
                bu.send(msg, `I couldn't find that user. Please make sure you're giving me a user id or a mention.`);
                return;
            }
            let response = await e.unban(msg, user, input.r);
            bu.send(msg, response[0]);
        }
    }
}

module.exports = UnbanCommand;
