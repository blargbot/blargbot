const { Guild } = require.main.require('./Tag/Classes');

class GuildIconTag extends Guild {
    constructor(client) {
        super(client, {
            name: 'icon',
            args: [],
            minArgs: 0, maxArgs: 0
        });
    }

    async execute(ctx, args) {
        const res = await super.execute(ctx, args);
        return res.setContent(ctx.guild.iconURL);
    }
}

module.exports = GuildIconTag;