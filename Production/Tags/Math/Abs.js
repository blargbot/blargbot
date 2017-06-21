const { Math } = require.main.require('./Tag/Classes');

class AbsTag extends Math {
    constructor(client) {
        super(client, {
            name: 'abs',
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

        let parsed = this.parseInt(args[0], 'number');

        return res.setContent(Math.abs(parsed));
    }
}

module.exports = AbsTag;