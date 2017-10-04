const { User } = require.main.require('./Tag/Classes');

class UserAvatarTag extends User {
    constructor(client) {
        super(client, {
            name: 'avatar',
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
        if (args.parsedArgs.user) {
            user = await ctx.client.Helpers.Resolve.user(ctx, args.parsedArgs.user.toString(), true);
        }
        return res.setContent(user ? user.avatarURL : '');
    }
}

module.exports = UserAvatarTag;