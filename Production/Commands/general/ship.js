const { GeneralCommand } = require('../../../Core/Structures/Command');

class ShipCommand extends GeneralCommand {
    constructor(client) {
        super(client, {
            name: 'ship'
        });
    }

    async execute(ctx) {
        if (ctx.input._.length < 2) {
            return await this.notEnoughParameters(ctx);
        }
        let users = [
            await ctx.client.Helpers.Resolve.user(ctx, ctx.input._[0]),
            await ctx.client.Helpers.Resolve.user(ctx, ctx.input._[1])
        ];

    }
}

module.exports = ShipCommand;