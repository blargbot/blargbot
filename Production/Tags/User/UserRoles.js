const { User } = require.main.require('./Tag/Classes');

class UserStatusTag extends User {
    constructor(client) {
        super(client, {
            name: 'roles',
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
        if (args.parsedArgs.user) {
            user = await ctx.client.Helpers.Resolve.user(ctx, args.parsedArgs.user.toString(), true);
        }

        if (user)
            member = ctx.guild.members.get(user.id);

        if (member) {
            res.setContent(new this.TagArray(member.roles));
        }

        return res;
    }
}

module.exports = UserStatusTag;