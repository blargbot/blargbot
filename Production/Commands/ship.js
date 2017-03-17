const { GeneralCommand } = _core.Structures.Command;

class ShipCommand extends GeneralCommand {
    constructor() {
        super({
            name: 'ship'
        });
    }

    async execute(ctx) {
        await super.execute(ctx);
        if (ctx.input._.length <= 2) {
            await this.notEnoughParameters(ctx);
            return;
        }

    }
}

module.exports = ShipCommand;