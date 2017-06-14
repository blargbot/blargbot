const { General } = require('../../../Core/Tag/Classes');

class ParseFloatTag extends General {
    constructor(client) {
        super(client, {
            name: 'parsefloat',
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

        let parsed = parseFloat(args[0]);
        if (isNaN(parsed)) res.setContent('NaN');
        else res.setContent(parsed);

        return res;
    }
}

module.exports = ParseFloatTag;