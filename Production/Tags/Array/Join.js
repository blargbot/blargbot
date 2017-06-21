const { Array } = require.main.require('./Tag/Classes');

class JoinTag extends Array {
    constructor(client) {
        super(client, {
            name: 'join',
            args: [
                {
                    name: 'array'
                }, {
                    name: 'delimiter'
                }
            ],
            minArgs: 2, maxArgs: 2
        });
    }

    async execute(ctx, args) {
        const res = await super.execute(ctx, args, true);
        let arr = await this.loadArray(ctx, args[0]);

        return res.setContent(arr.join(args[1]));
    }
}

module.exports = JoinTag;