const { Array } = require.main.require('./Tag/Classes');

class IsArrayTag extends Array {
    constructor(client) {
        super(client, {
            name: 'isarray',
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
        return res.setContent(args[0].length === 1 && args[0][0] instanceof this.TagArray);
    }
}

module.exports = IsArrayTag;