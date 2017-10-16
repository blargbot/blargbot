const { Math } = require.main.require('./Tag/Classes');

class MathBaseTag extends Math {
    constructor(client) {
        super(client, {
            name: 'base',
            args: [
                {
                    name: 'number'
                }, {
                    name: 'radix'
                }, {
                    name: 'origin',
                    optional: true
                }
            ],
            minArgs: 2, maxArgs: 3
        });
    }

    async execute(ctx, args) {
        const res = await super.execute(ctx, args);
        let { number, origin = 10, radix } = args.parsedArgs;

        if (radix < 2 || radix > 36) {
            this.throw('error.tag.invalidradix', {
                radix
            });
        }

        number = this.parseInt(number, 'number', origin);

        return res.setContent(number.toString(radix));
    }
}

module.exports = MathBaseTag;