const BaseCommand = require('../structures/BaseCommand');

class ListCommand extends BaseCommand {
    constructor() {
        super({
            name: 'list',
            category: bu.CommandType.CAT,
            hidden: true
        });
    }

    async execute(msg, words, text) {
        if (msg.channel.id === config.discord.channel) {
            bu.reloadUserList();
            bu.send(msg, 'Reloaded the user list! Check the channel topic.');
        }
    }
}

module.exports = ListCommand;
