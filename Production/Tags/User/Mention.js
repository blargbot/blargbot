const { User } = require.main.require('./Tag/Classes');

class UserMentionTag extends User {
    constructor(client) {
        super(client, {
            name: 'mention',
            args: [
                {
                    name: 'user',
                    optional: true
                }
            ],
            ccommand: true,
            minArgs: 0, maxArgs: 1
        });
    }

    async execute(ctx, args) {
        const res = await super.execute(ctx, args);
        let user = ctx.user;
        if (args[0]) {
            user = await ctx.client.Helpers.Resolve.user(args[0].toString(), ctx, true);
        }
        return res.setContent(user ? user.mention : '');
    }
}

module.exports = UserMentionTag;