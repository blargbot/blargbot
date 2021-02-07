const BaseCommand = require('../structures/BaseCommand');
const newbutils = require('../newbu');

class VersionCommand extends BaseCommand {
    constructor() {
        super({
            name: 'version',
            category: newbutils.commandTypes.GENERAL,
            usage: 'version',
            info: 'Tells you what version I am on'
        });
    }

    async execute(msg, words, text) {
        bu.send(msg, `I am running blargbot version ${await bu.getVersion()}!`);
    }
}

module.exports = VersionCommand;
