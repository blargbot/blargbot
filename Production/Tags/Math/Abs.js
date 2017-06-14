const { General } = require('../../../Core/Tag/Classes');

class AbsTag extends General {
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
        const res = await super.execute(ctx, args, false);

        let parsed = parseInt(args[0]);
        if (isNaN(parsed)) this.throw('error.tag.isnan', {
            arg: 'Number',
            value: args[0]
        });

        return res.setContent(Math.abs(parsed));
    }
}

module.exports = AbsTag;