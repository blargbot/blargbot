const { Guild } = require.main.require('./Tag/Classes');

class GuildIdTag extends Guild {
    constructor(client) {
        super(client, {
            name: 'id',
            args: [],
            minArgs: 0, maxArgs: 0
        });
    }

    async execute(ctx, args) {
        const res = await super.execute(ctx, args);
        return res.setContent(ctx.guild.name);
    }
}

module.exports = GuildIdTag;