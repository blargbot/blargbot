const { Guild } = require.main.require('./Tag/Classes');

class GuildChannelsTag extends Guild {
    constructor(client) {
        super(client, {
            name: 'channels',
            args: [],
            minArgs: 0, maxArgs: 0
        });
    }

    async execute(ctx, args) {
        const res = await super.execute(ctx, args);
        const channels = ctx.guild.channels.map(c => c).sort((a, b) => {
            return a.position - b.position;
        }).map(c => c.id);
        return res.setContent(new this.TagArray(channels));
    }
}

module.exports = GuildChannelsTag;