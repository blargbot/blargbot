const { Role } = require.main.require('./Tag/Classes');

class RoleNameTag extends Role {
    constructor(client) {
        super(client, {
            name: 'name',
            args: [
                {
                    name: 'role'
                }
            ],
            minArgs: 1, maxArgs: 1
        });
    }

    async execute(ctx, args) {
        const res = await super.execute(ctx, args);
        let role;
        if (args[0]) {
            role = await ctx.client.Helpers.Resolve.role(args[0].toString(), ctx, true);
        }
        return res.setContent(role ? role.name : '');
    }
}

module.exports = RoleNameTag;