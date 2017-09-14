const { GeneralCommand } = require('../../../Core/Structures/Command');

class ShipCommand extends GeneralCommand {
    constructor(client) {
        super(client, {
            name: 'ship',
            keys: {
                nousers: '.notenough',
                final: '.final'
            },
            minArgs: 2
        });
    }

    async execute(ctx) {
        let users = [
            await ctx.client.Helpers.Resolve.user(ctx, ctx.input._[0]),
            await ctx.client.Helpers.Resolve.user(ctx, ctx.input._[1])
        ];
        console.log(users);
        if (!users[0] || !users[1])
            return await ctx.decodeAndSend(this.keys.nousers);

        ctx.client.Helpers.Random.shuffle(users);

        let firstPart = users[0].username.substring(0, users[0].username.length / 2);
        let lastPart = users[1].username.substring(users[1].username.length / 2);

        await ctx.decodeAndSend(this.keys.final, {
            name: firstPart + lastPart
        });
    }
}

module.exports = ShipCommand;