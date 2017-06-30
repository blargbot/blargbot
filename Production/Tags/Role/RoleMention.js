const { Role } = require.main.require('./Tag/Classes');

class RoleMentionTag extends Role {
    constructor(client) {
        super(client, {
            name: 'mention',
            args: [
                {
                    name: 'role'
                }
            ],
            ccommand: true,
            minArgs: 1, maxArgs: 1
        });
    }

    async execute(ctx, args) {
        const res = await super.execute(ctx, args);
        let role;
        if (args[0]) {
            role = await ctx.client.Helpers.Resolve.role(ctx, args[0].toString(), true);
        }
        // Todo: make mentionable?
        return res.setContent(role ? role.mention : '');
    }
}

module.exports = RoleMentionTag;