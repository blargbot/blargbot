const { GeneralCommand } = require('../../../Core/Structures/Command');

class PingCommand extends GeneralCommand {
    constructor(client) {
        super(client, {
            name: 'ping',
            keys: {
                randmsg: `.randmsg`,
                final: `.final`
            }
        });

    }

    async execute(ctx) {
        const msg2 = await ctx.decodeAndSend(this.keys.randmsg);
        await msg2.edit(await ctx.decode(this.keys.final, { time: msg2.timestamp - ctx.msg.timestamp }));
    }
}

module.exports = PingCommand;