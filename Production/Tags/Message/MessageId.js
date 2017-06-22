const { Message } = require.main.require('./Tag/Classes');

class MessageIdTag extends Message {
    constructor(client) {
        super(client, {
            name: 'id',
            args: [
                {
                    name: 'user',
                    optional: true
                }
            ],
            minArgs: 0, maxArgs: 1
        });
    }

    async execute(ctx, args) {
        const res = await super.execute(ctx, args);
        let user = ctx.user;
        if (args[0]) {
            user = await ctx.client.Helpers.Resolve.user(args[0].toString(), ctx, true);
        }
        return res.setContent(user ? user.id : '');
    }
}

module.exports = MessageIdTag;