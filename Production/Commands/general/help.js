const { GeneralCommand } = require('../../../Core/Structures/Command');

class HelpCommand extends GeneralCommand {
    constructor(client) {
        super(client, {
            name: 'help'
        });
    }

    async execute(ctx) {
        return 'help urself';
    }
}

module.exports = HelpCommand;