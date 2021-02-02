const BaseCommand = require('../structures/BaseCommand');
const newbutils = require('../newbu');

class DebugCommand extends BaseCommand {
    constructor() {
        super({
            name: 'debug',
            category: newbutils.commandTypes.CAT
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
