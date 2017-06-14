const { User } = require.main.require('./Tag/Classes');

class UserNickTag extends User {
    constructor(client) {
        super(client, {
            name: 'nick',
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

        if (member) {
            res.setContent(member.nick || member.user.username);
        } else if (user) {
            res.setContent(user.username);
        }

        return res;
    }
}

module.exports = UserNickTag;