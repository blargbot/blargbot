const { Channel } = require.main.require('./Tag/Classes');

class ChannelTopicTag extends Channel {
  constructor(client) {
    super(client, {
      name: 'topic',
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
    args = args.parsedArgs;
    let channel = ctx.channel;
    if (args.channel) {
      channel = await ctx.client.Helpers.Resolve.channel(ctx, args.channel.toString(), true);
    }
    return res.setContent(channel ? channel.topic : '');
  }
}

module.exports = ChannelTopicTag;