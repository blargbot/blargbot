const { Guild } = require.main.require('./Tag/Classes');

class GuildRegionTag extends Guild {
    constructor(client) {
        super(client, {
            name: 'region',
            args: [],
            minArgs: 0, maxArgs: 0
        });
    }

    async execute(ctx, args) {
        const res = await super.execute(ctx, args);
        return res.setContent(ctx.guild.region);
    }
}

module.exports = GuildRegionTag;