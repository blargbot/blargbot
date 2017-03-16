const { CatCommand } = _core.Structures.Command;

class EvalCommand extends CatCommand {
    constructor() {
        super({
            name: 'eval'
        });
    }

    async execute(ctx) {
        await super.execute(ctx);
        const msg2 = await ctx.send('Pong!');
    }
}

module.exports = EvalCommand;