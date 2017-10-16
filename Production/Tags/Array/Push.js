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
        args = args.parsedArgs;
        let arr = await this.loadArray(ctx, args.array);

        arr.push(...args.slice(1));
        if (arr.ctx && arr.name) await arr.save();

        return res.setContent(arr);
    }
}

module.exports = PushTag;