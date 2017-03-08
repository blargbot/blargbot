const { GeneralCommand } = _core.Structures.Command;

class PingCommand extends GeneralCommand {
    constructor() {
        super({
            name: 'ping',
            usage: _constants.Messages.Command.ping.usage(),
            info: _constants.Messages.Command.ping.info()
        });
    }

    async execute(ctx) {
        await super.execute(ctx);
        const msg2 = await ctx.send('Pong!');
    }
}

module.exports = PingCommand;