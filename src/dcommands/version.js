const BaseCommand = require('../structures/BaseCommand');

class VersionCommand extends BaseCommand {
    constructor() {
        super({
            name: 'version',
            category: bu.CommandType.GENERAL,
            usage: 'version',
            info: 'Tells you what version I am on'
        });
    }

    async execute(msg, words, text) {
        bu.send(msg, `I am running blargbot version ${await bu.getVersion()}!`);
    }
}

module.exports = VersionCommand;
