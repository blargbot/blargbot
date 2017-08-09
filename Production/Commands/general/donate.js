const { GeneralCommand } = require('../../../Core/Structures/Command');

class DonateCommand extends GeneralCommand {
    constructor(client) {
        super(client, {
            name: 'donate',
            keys: {
                message: '.message'
            }
        });
    }

    async execute(ctx) {
        await ctx.decodeAndSend(this.keys.message);
    }
}

module.exports = DonateCommand;