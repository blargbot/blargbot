const { General } = require.main.require('./Tag/Classes');

class CleanTag extends General {
    constructor(client) {
        super(client, {
            name: 'set',
            args: [
                {
                    name: 'name'
                }, {
                    name: 'value'
                }
            ],
            minArgs: 1, maxArgs: 2
        });
    }

    async execute(ctx, args) {
        const res = await super.execute(ctx, args);
        let variable = await ctx.client.TagVariableManager.executeSet(ctx, args[0], args[1]);

        return res;
    }
}

module.exports = CleanTag;