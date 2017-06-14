const { Channel } = require.main.require('./Tag/Classes');

class ChannelPositionTag extends Channel {
    constructor(client) {
        super(client, {
            name: 'channelposition',
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
            channel = await ctx.client.Helpers.Resolve.channel(args[0].toString(), ctx, true);
        }
        return res.setContent(channel ? channel.position : '');
    }
}

module.exports = ChannelPositionTag;