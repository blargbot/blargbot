const { Math } = require.main.require('./Tag/Classes');

class FloorTag extends Math {
    constructor(client) {
        super(client, {
            name: 'floor',
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

        return res.setContent(global.Math.floor(parsed));
    }
}

module.exports = FloorTag;