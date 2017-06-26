const { General } = require.main.require('./Tag/Classes');

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
        if (typeof args[0][0] === 'string')
            args[0][0] = args[0][0].replace(/^\s+/, '');
        if (typeof args[0][args[0].length - 1] === 'string')
            args[0][args[0].length - 1] = args[0][args[0].length - 1].replace(/\s+$/, '');
        return res.setContent(args[0]);
    }
}

module.exports = TrimTag;