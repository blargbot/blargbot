const { Guild } = require.main.require('./Tag/Classes');

class GuildRolesTag extends Guild {
    constructor(client) {
        super(client, {
            name: 'roles',
            args: [],
            minArgs: 0, maxArgs: 0
        });
    }

    async execute(ctx, args) {
        const res = await super.execute(ctx, args);
        const roles = ctx.guild.roles.map(r => r).sort((a, b) => {
            return b.position - a.position;
        }).map(r => r.id);
        return res.setContent(new this.TagArray(roles));
    }
}

module.exports = GuildRolesTag;