const { General } = require.main.require('./Tag/Classes');

class NewLineTag extends General {
    constructor(client) {
        super(client, {
            name: 'newline',
            args: [
                {
                    name: 'length',
                    optional: true
                }
            ],
            minArgs: 0, maxArgs: 1
        });
    }

    async execute(ctx, args) {
        const res = await super.execute(ctx, args);

        let length = args[0] ? this.parseInt(args[0]) : 1;
        return res.setContent('\n'.repeat(length));
    }
}

module.exports = NewLineTag;