const { Array } = require.main.require('./Tag/Classes');

class LengthTag extends Array {
    constructor(client) {
        super(client, {
            name: 'length',
            args: [
                {
                    name: 'array'
                }
            ],
            minArgs: 1, maxArgs: 1
        });
    }

    async execute(ctx, args) {
        const res = await super.execute(ctx, args, true);
        let arr = await this.loadArray(ctx, args[0]);

        return res.setContent(arr.length);
    }
}

module.exports = LengthTag;