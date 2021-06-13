const BaseCommand = require('../structures/BaseCommand');

class ExportCommand extends BaseCommand {
    constructor() {
        super({
            name: 'export',
            category: bu.CommandType.ADMIN,
            aliases: []
        });
    }

    async execute(msg, words, text) {

    }
}

module.exports = ExportCommand;
