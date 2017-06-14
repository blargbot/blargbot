const { General } = require('../../../Core/Tag/Classes');

class ParseIntTag extends General {
    constructor(client) {
        super(client, {
            name: 'parseint',
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
        if (isNaN(parsed)) res.setContent('NaN');
        else res.setContent(parsed);

        return res;
    }
}

module.exports = ParseIntTag;