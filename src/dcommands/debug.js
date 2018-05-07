const BaseCommand = require('../structures/BaseCommand');

class DebugCommand extends BaseCommand {
    constructor() {
        super({
            name: 'debug',
            category: bu.CommandType.CAT
        });
    }

    async execute(msg, words, text) {
        if (msg.author.id == bu.CAT_ID) {
            let debug = console.toggleDebug();
            if (debug) bu.send(msg, 'Debug logging is now enabled.');
            else bu.send(msg, 'Debug logging is now disabled.');
        }
    }
}

module.exports = DebugCommand;
