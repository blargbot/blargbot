const { Array } = require.main.require('./Tag/Classes');

class PushTag extends Array {
    constructor(client) {
        super(client, {
            name: 'push',
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
        let arr;
        if (args[0].length === 1 && args[0][0] instanceof this.TagArray) {
            arr = args[0][0];
        } else {
            arr = await new this.TagArray().load(ctx, args[0].join(''));
        }
        arr.push(...args.slice(1));
        if (arr.ctx && arr.name) await arr.save();

        return res.setContent(arr);
    }
}

module.exports = PushTag;