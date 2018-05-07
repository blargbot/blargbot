const BaseCommand = require('../structures/BaseCommand');

class EvalCommand extends BaseCommand {
    constructor() {
        super({
            name: 'eval',
            category: bu.CommandType.CAT
        });
    }

    async execute(msg, words, text) {
        bot.eval(msg, text);
    }
}

module.exports = EvalCommand;
