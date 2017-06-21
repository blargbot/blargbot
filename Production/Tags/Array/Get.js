const { Array } = require.main.require('./Tag/Classes');

class GetTag extends Array {
    constructor(client) {
        super(client, {
            name: 'get',
            args: [
                {
                    name: 'array'
                }, {
                    name: 'index'
                }
            ],
            minArgs: 2, maxArgs: 2
        });
    }

    async execute(ctx, args) {
        const res = await super.execute(ctx, args, true);
        let arr = await this.loadArray(ctx, args[0]);
        let index = this.parseInt(args[1], 'index');

        return res.setContent(arr[index]);
    }
}

module.exports = GetTag;