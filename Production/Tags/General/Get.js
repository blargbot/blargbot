const { General } = require.main.require('./Tag/Classes');

class CleanTag extends General {
    constructor(client) {
        super(client, {
            name: 'get',
            args: [
                {
                    name: 'name'
                }
            ],
            minArgs: 1, maxArgs: 1
        });
    }

    async execute(ctx, args) {
        const res = await super.execute(ctx, args);

        let variable = await ctx.client.TagVariableManager.executeGet(ctx, args[0]) || '';
        return res.setContent(variable);
    }
}

module.exports = CleanTag;