const { General } = require('../../../Core/Structures/Tag');

class TrimTag extends General {
    constructor(client) {
        super(client, {
            name: 'trim',
            args: [
                {
                    name: 'text'
                }
            ],
            minArgs: 1, maxArgs: 1
        });
    }

    async execute(ctx, args) {
        const res = await super.execute(ctx, args);
        return res.setContent(args[0].trim());
    }
}

module.exports = TrimTag;