const { Guild } = require.main.require('./Tag/Classes');

class GuildCreatedAtTag extends Guild {
    constructor(client) {
        super(client, {
            name: 'createdat',
            args: [],
            minArgs: 0, maxArgs: 0
        });
    }

    async execute(ctx, args) {
        const res = await super.execute(ctx, args);
        return res.setContent(ctx.guild.createdAt);
    }
}

module.exports = GuildCreatedAtTag;