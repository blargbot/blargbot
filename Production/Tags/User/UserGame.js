const { User } = require.main.require('./Tag/Classes');

class UserGameTag extends User {
    constructor(client) {
        super(client, {
            name: 'usergame',
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
        let user = ctx.user, member;
        if (args[0]) {
            user = await ctx.client.Helpers.Resolve.user(args[0].toString(), ctx, true);
        }
        if (user)
            member = ctx.guild.members.get(user.id);
        return res.setContent(member && member.game ? member.game.name : '');
    }
}

module.exports = UserGameTag;