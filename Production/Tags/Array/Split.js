const { Array } = require.main.require('./Tag/Classes');

class SplitTag extends Array {
    constructor(client) {
        super(client, {
            name: 'split',
            args: [
                {
                    name: 'text'
                }, {
                    name: 'delimiter',
                    optional: true
                }
            ],
            minArgs: 1, maxArgs: 2
        });
    }

    async execute(ctx, args) {
        const res = await super.execute(ctx, args, true);
        let arr = new this.TagArray(...args[0].toString().split(args[1] || ''));

        return res.setContent(arr);
    }
}

module.exports = SplitTag;