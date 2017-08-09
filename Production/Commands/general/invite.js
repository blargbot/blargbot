const { GeneralCommand } = require('../../../Core/Structures/Command');

class InviteCommand extends GeneralCommand {
    constructor(client) {
        super(client, {
            name: 'invite',
            keys: {
                message: '.message'
            }
        });
    }

    async execute(ctx) {
        await ctx.decodeAndSend(this.keys.message);
    }
}

module.exports = InviteCommand;