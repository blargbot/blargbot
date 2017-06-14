const { Math } = require.main.require('./Tag/Classes');

class MathBaseTag extends General {
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
        const res = await super.execute(ctx, args, false);
        let integer, origin, radix;

        if (args.length == 2) {
            origin = 10;
            radix = parseInt(args[1]);
            if (isNaN(origin)) this.throw('error.tag.isnan', {
                arg: 'Radix',
                value: args[1]
            });
        } else {
            origin = parseInt(args[1]);
            radix = parseInt(args[2]);
            if (isNaN(integer)) this.throw('error.tag.isnan', {
                arg: 'Origin',
                value: args[1]
            });
            if (isNaN(integer)) this.throw('error.tag.isnan', {
                arg: 'Radix',
                value: args[2]
            });
        }

        if (radix < 2 || radix > 36) {
            this.throw('error.tag.invalidradix', {
                radix
            });
        }

        integer = parseInt(args[0], origin);

        if (isNaN(integer)) this.throw('error.tag.isnan', {
            arg: 'Number',
            value: args[0]
        });

        return res.setContent(integer.toString(radix));
    }
}

module.exports = MathBaseTag;