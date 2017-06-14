const { Info } = require.main.require('./Tag/Classes');

class UserJoinedAtTag extends Info {
    constructor(client) {
        super(client, {
            name: 'userjoinedat',
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
        return res.setContent(member ? member.joinedAt : '');
    }
}

module.exports = UserJoinedAtTag;