const { Channel } = require.main.require('./Tag/Classes');

class ChannelNameTag extends Channel {
    constructor(client) {
        super(client, {
            name: 'name',
            args: [
                {
                    name: 'channel',
                    optional: true
                }
            ],
            minArgs: 0, maxArgs: 1
        });
    }

    async execute(ctx, args) {
        const res = await super.execute(ctx, args);
        let channel = ctx.channel;
        if (args[0]) {
            channel = await ctx.client.Helpers.Resolve.channel(ctx, args[0].toString(), true);
        }
        return res.setContent(channel ? channel.name : '');
    }
}

module.exports = ChannelNameTag;