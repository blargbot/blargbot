const BaseCommand = require('../structures/BaseCommand');

class ReloadCommand extends BaseCommand {
    constructor() {
        super({
            name: 'reload',
            category: bu.CommandType.CAT
        });
    }

    async execute(msg, words, text) {
        if (msg.author.id === bu.CAT_ID) {
            bu.emitter.emit('reloadConfig');
            bu.send(msg, ':ok_hand:');
        }
    }
}

module.exports = ReloadCommand;
