const { Math } = require.main.require('./Tag/Classes');

class RoundTag extends Math {
    constructor(client) {
        super(client, {
            name: 'round',
            args: [
                {
                    name: 'number'
                }
            ],
            minArgs: 1, maxArgs: 1
        });
    }

    async execute(ctx, args) {
        const res = await super.execute(ctx, args);

        let parsed = this.parseFloat(args[0], 'number');

        return res.setContent(Math.round(parsed));
    }
}

module.exports = RoundTag;