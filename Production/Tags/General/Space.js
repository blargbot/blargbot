const { General } = require.main.require('./Tag/Classes');

class SpaceTag extends General {
    constructor(client) {
        super(client, {
            name: 'space',
            args: [
                {
                    name: 'length',
                    optional: true
                }
            ],
            minArgs: 0, maxArgs: 1
        });
    }

    async execute(ctx, args) {
        const res = await super.execute(ctx, args);

        let length = args[0] ? this.parseInt(args[0]) : 1;
        return res.setContent(' '.repeat(length));
    }
}

module.exports = SpaceTag;