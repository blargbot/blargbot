const BaseCommand = require('../structures/BaseCommand');
const newbutils = require('../newbu');

class EvalCommand extends BaseCommand {
    constructor() {
        super({
            name: 'eval',
            category: newbutils.commandTypes.CAT
        });
    }

    async execute(msg, words, text) {
        bot.eval(msg, text);
    }
}

module.exports = EvalCommand;
