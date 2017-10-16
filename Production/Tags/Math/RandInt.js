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
        let { min = 0, max } = args.parsedArgs;
        min = this.parseInt(min);
        max = this.parseInt(max);

        if (max < min) {
            let temp = min;
            min = max;
            max = temp;
        }

        res.setContent(ctx.client.Helpers.Random.randInt(min, max));
        return res;
    }
}

module.exports = RandIntTag;