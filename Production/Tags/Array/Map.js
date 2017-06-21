const { Array } = require.main.require('./Tag/Classes');

class MapTag extends Array {
    constructor(client) {
        super(client, {
            name: 'map',
            args: [
                {
                    name: 'array'
                }, {
                    name: 'varName',
                    optional: true
                }, {
                    name: 'function'
                }
            ],
            minArgs: 2, maxArgs: 3
        });
    }

    async execute(ctx, args) {
        const res = await super.execute(ctx, args, false);
        args[0] = await ctx.processSub(args[0]);
        if (args.length === 3)
            args[1] = await ctx.processSub(args[1]);

        let arr = await this.loadArray(ctx, args[0]);
        let name = args.length === 3 ? args[1] : 'i';
        let code = args.length === 3 ? args[2] : args[1];

        for (let i = 0; i < arr.length; i++) {
            ctx.client.TagVariableManager.executeSet(ctx, name, arr[i]);
            arr[i] = await ctx.processSub(code);
        }

        if (arr.ctx && arr.name) await arr.save();

        return res.setContent(arr);
    }

}

module.exports = MapTag;