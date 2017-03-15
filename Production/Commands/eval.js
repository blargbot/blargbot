const { CatCommand } = _core.Structures.Command;

class EvalCommand extends CatCommand {
    constructor() {
        super({
            name: 'eval',
            usage: _constants.Messages.Command.ping.usage(),
            info: _constants.Messages.Command.ping.info()
        });
    }

    async execute(ctx) {
        await super.execute(ctx);
        const msg2 = await ctx.send('Pong!');
    }
}

module.exports = EvalCommand;