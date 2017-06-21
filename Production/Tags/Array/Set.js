const { Array } = require.main.require('./Tag/Classes');

class SetTag extends Array {
    constructor(client) {
        super(client, {
            name: 'set',
            args: [
                {
                    name: 'array'
                }, {
                    name: 'index'
                }, {
                    name: 'value'
                }
            ],
            minArgs: 3, maxArgs: 3
        });
    }

    async execute(ctx, args) {
        const res = await super.execute(ctx, args, true);
        let arr = await this.loadArray(ctx, args[0]);
        let index = this.parseInt(args[1], 'index');

        arr[index] = args[2];
        await arr.save();

        return res;
    }
}

module.exports = SetTag;