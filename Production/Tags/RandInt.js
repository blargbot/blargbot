const { Tag } = require('../../Core/Structures');

class RandIntTag extends Tag {
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
        const res = await super.execute(ctx, args, true);
        let min, max;
        if (args.length == 1) min = 0, max = parseInt(args[0]);
        else min = parseInt(args[0]), max = parseInt(args[1]);

        if (isNaN(min) || isNaN(max)) {
            this.throw('error.tag.isnan', {
                arg: isNaN(min) ? 'Min' : 'Max'
            });
        }
        if (max < min) {
            this.throw('error.tag.maxlessthanmin');
        }

        res.setContent(ctx.client.Helpers.Random.getRandomInt(min, max));
        return res;
    }
}

module.exports = RandIntTag;