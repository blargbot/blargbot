const { Math } = require.main.require('./Tag/Classes');

class RandIntTag extends Math {
    constructor(client) {
        super(client, {
            name: 'randint',
            args: [
                {
                    name: 'min',
                    optional: true
                }, {
                    name: 'max'
                }
            ],
            minArgs: 1, maxArgs: 2
        });
    }

    async execute(ctx, args) {
        const res = await super.execute(ctx, args);
        let min, max;
        if (args.length === 1) min = 0, max = this.parseInt(args[0], 'max');
        else min = this.parseInt(args[0], 'min'), max = this.parseInt(args[1], 'max');

        if (max < min) {
            this.throw('error.tag.maxlessthanmin');
        }

        res.setContent(ctx.client.Helpers.Random.randInt(min, max));
        return res;
    }
}

module.exports = RandIntTag;