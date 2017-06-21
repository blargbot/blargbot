const { Array } = require.main.require('./Tag/Classes');

class UnshiftTag extends Array {
    constructor(client) {
        super(client, {
            name: 'unshift',
            args: [
                {
                    name: 'array'
                }, {
                    name: 'value',
                    repeat: true
                }
            ],
            minArgs: 2
        });
    }

    async execute(ctx, args) {
        const res = await super.execute(ctx, args, true);
        let arr = await this.loadArray(ctx, args[0]);

        arr.unshift(...args.slice(1));
        if (arr.ctx && arr.name) await arr.save();

        return res.setContent(arr);
    }
}

module.exports = UnshiftTag;