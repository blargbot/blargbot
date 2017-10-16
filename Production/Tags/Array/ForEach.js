const { Array } = require.main.require('./Tag/Classes');

class ForEachTag extends Array {
    constructor(client) {
        super(client, {
            name: 'foreach',
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
        args = args.parsedArgs;
        args.array = await ctx.processSub(args.array);
        if (args.varName)
            args.varName = await ctx.processSub(args.varName);

        let arr = await this.loadArray(ctx, args.array);
        let name = args.varName || 'i';
        let code = args.function;
        let output;
        for (let i = 0; i < arr.length; i++) {
            ctx.client.TagVariableManager.executeSet(ctx, name, arr[i]);
            let result = await ctx.processSub(code);
            if (!output) output = result;
            else output = output.concat(result);
        }

        return res.setContent(output);
    }

}

module.exports = ForEachTag;