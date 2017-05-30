const { GeneralCommand } = require('../../../Core/Structures/Command');

class ShipCommand extends GeneralCommand {
    constructor(client) {
        super(client, {
            name: 'ship'
        });
    }

    async execute(ctx) {
        if (ctx.input._.length < 2) {
            await this.notEnoughParameters(ctx);
            return;
        }

    }
}

module.exports = ShipCommand;