const { Info } = require.main.require('./Tag/Classes');

class UserStatusTag extends Info {
    constructor(client) {
        super(client, {
            name: 'userroles',
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
            const arr = new this.TagArray();
            for (const role of member.roles) arr.push(role);
            _logger.debug(arr);
            res.setContent(arr);
        }

        return res;
    }
}

module.exports = UserStatusTag;