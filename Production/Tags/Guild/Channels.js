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
        const arr = new this.TagArray();
        const channels = ctx.guild.channels.map(c => c).sort((a, b) => {
            return a.position - b.position;
        }).map(c => c.id);
        for (const channel in channels) {
            arr.push(channel);
        }
        return res.setContent(arr);
    }
}

module.exports = GuildChannelsTag;