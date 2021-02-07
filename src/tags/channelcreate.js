const Builder = require('../structures/TagBuilder');

const typeMap = {
  'text': 0,
  'voice': 2,
  'category': 4
};

module.exports =
  Builder.APITag('channelcreate')
    .withArgs(a => [
      a.required('name'),
      a.optional('type'),
      a.optional('options')
    ])
    .withDesc('Creates a channel with the given information. ' +
      '`type` is either `text`, `voice`, or `category`. Defaults to `text`.\n' +
      '`options` is a JSON object, containing any or all of the following properties:\n' +
      '- `topic`\n' +
      '- `nsfw`\n' +
      '- `parentID`\n' +
      '- `rateLimitPerUser`\n' +
      '- `bitrate` (voice)\n' +
      '- `userLimit` (voice)\n' +
      'Returns the new channel\'s ID.')
    .withExample(
      '{channelcreate;super-channel;text}',
      '11111111111111111'
    )
    .whenArgs(0, Builder.errors.notEnoughArguments)
    .whenArgs('1-5', async function (subtag, context, args) {
      let permission = Builder.util.getPerms(context);

      if (!permission.has('manageChannels'))
        return Builder.util.error(subtag, context, 'Author cannot create channels');

      const name = args[0];
      const type = typeMap[(args[1] || 'text').toLowerCase()] || 0;
      const options = JSON.parse(args[2] || '{}');

      try {
        let fullReason = bu.formatAuditReason(context.user, context.scope.reason);
        let channel = await context.guild.createChannel(name, type, options, fullReason);
        if (!context.guild.channels.get(channel.id))
          context.guild.channels.add(channel);
        return channel.id;
      } catch (err) {
        console.error(err.stack);
        return Builder.util.error(subtag, context, 'Failed to create channel: no perms');
      }
    })
    .whenDefault(Builder.errors.tooManyArguments)
    .build();
