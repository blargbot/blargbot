const BaseCommand = require('../structures/BaseCommand');
const newbutils = require('../newbu');

class ListCommand extends BaseCommand {
    constructor() {
        super({
            name: 'list',
            category: newbutils.commandTypes.CAT,
            hidden: true
        });
    }

    async execute(msg) {
        if (msg.channel.id === config.discord.channel) {
            bu.reloadUserList();
            bu.send(msg, 'Reloaded the user list! Check the channel topic.');
        }
    }
}

module.exports = ListCommand;
