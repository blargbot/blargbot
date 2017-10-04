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
        args = args.parsedArgs;

        let parsed = this.parseInt(args.number, 'number');

        return res.setContent(global.Math.abs(parsed));
    }
}

module.exports = AbsTag;