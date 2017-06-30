const { User } = require.main.require('./Tag/Classes');

class UserSetNick extends User {
    constructor(client) {
        super(client, {
            name: 'setnick',
            args: [
                {
                    name: 'user',
                    optional: true
                }, {
                    name: 'nick'
                }
            ],
            minArgs: 1, maxArgs: 2,
            ccommand: true, requiresStaff: true,
            permissions: [client.Constants.Permissions.MANAGE_NICKNAMES]
        });
    }

    async execute(ctx, args) {
        const res = await super.execute(ctx, args);
        let user = ctx.user, member;
        let nick;
        if (args[1]) {
            user = await ctx.client.Helpers.Resolve.user(ctx, args[0].toString(), true);
            nick = args[1];
        } else nick = args[0];
        if (user) {
            member = ctx.guild.members.get(user.id);
            if (!member) throw new this.TagError('error.memberundef', {
                member: args[0]
            });
            try {
                await member.edit({
                    nick: nick.join('')
                });
            } catch (err) {
                throw new this.TagError('error.tag.toolow', {
                    target: member.user.fullName,
                    tag: this.name
                });
            }
        }
        return res;
    }
}

module.exports = UserSetNick;