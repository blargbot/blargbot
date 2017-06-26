const { Math } = require.main.require('./Tag/Classes');

class RoundTag extends Math {
    constructor(client) {
        super(client, {
            name: 'round',
            args: [
                {
                    name: 'number'
                }, {
                    name: 'places',
                    optional: true
                }
            ],
            minArgs: 1, maxArgs: 2
        });
    }

    async execute(ctx, args) {
        const res = await super.execute(ctx, args);

        let parsed = this.parseFloat(args[0], 'number');
        let places = args[1] ? this.parseFloat(args[1], 'places') : 0;

        let output = global.Math.round(parsed * (10 ** places)) / (10 ** places);

        return res.setContent(output);
    }
}

module.exports = RoundTag;