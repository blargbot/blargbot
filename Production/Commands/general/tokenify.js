const { GeneralCommand } = require('../../../Core/Structures/Command');

class TokenifyCommand extends GeneralCommand {
    constructor(client) {
        super(client, {
            name: 'tokenify'
        });
    }

    async execute(ctx) {
        if (ctx.input._.length < 1) {
            return await this.notEnoughParameters(ctx);
        }
        let input = ctx.input._.join(' ').replace(/[^0-9a-z]/gi, '').toLowerCase();
        let output = [];
        for (let i = 0; i < input.length; i++) {
            if (ctx.client.Helpers.Random.chance(1, 2))
                output.push(input[i].toUpperCase());
            else output.push(input[i]);
        }
    }
}

module.exports = TokenifyCommand;