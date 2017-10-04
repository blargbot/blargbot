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
        args = args.parsedArgs;

        let length = args.length ? this.parseInt(args.length) : 1;
        return res.setContent(' '.repeat(length));
    }
}

module.exports = SpaceTag;