const BaseCommand = require('../structures/BaseCommand');
const newbutils = require('../newbu');

class DmerrorsCommand extends BaseCommand {
    constructor() {
        super({
            name: 'dmerrors',
            category: newbutils.commandTypes.GENERAL,
            usage: 'dmerrors',
            info: 'Toggles whether to DM you errors.'
        });
    }

    async execute(msg) {
        let storedUser = await r.table('user').get(msg.author.id);

        await r.table('user').get(msg.author.id).update({
            dontdmerrors: storedUser.dontdmerrors ? false : true
        });
        if (storedUser.dontdmerrors) {
            bu.send(msg, 'I will now DM you if I have an issue running a command.');
        } else {
            bu.send(msg, 'I won\'t DM you if I have an issue running a command.');
        }
    }
}

module.exports = DmerrorsCommand;
