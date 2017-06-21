const { Math } = require.main.require('./Tag/Classes');

class MathBaseTag extends Math {
    constructor(client) {
        super(client, {
            name: 'base',
            args: [
                {
                    name: 'number'
                }, {
                    name: 'origin',
                    optional: true
                }, {
                    name: 'radix'
                }
            ],
            minArgs: 2, maxArgs: 3
        });
    }

    async execute(ctx, args) {
        const res = await super.execute(ctx, args);
        let integer, origin, radix;

        if (args.length == 2) {
            origin = 10;
            radix = this.parseInt(args[1], 'radix');
        } else {
            origin = this.parseInt(args[1], 'origin');
            radix = this.parseInt(args[2], 'radix');
        }

        if (radix < 2 || radix > 36) {
            this.throw('error.tag.invalidradix', {
                radix
            });
        }

        integer = this.parseInt(args[0], 'number', origin);

        return res.setContent(integer.toString(radix));
    }
}

module.exports = MathBaseTag;