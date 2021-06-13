const Builder = require('../structures/TagBuilder');

const typeMap = {
  'text': 0,
  'voice': 2,
  'category': 4
};

module.exports =
  Builder.APITag('channeledit')
    .withArgs(a => [
      a.require('id'),
      a.optional('options')
    ])
    .withDesc('Edits a channel with the given information.\n' +
      '`options` is a JSON object, containing any or all of the following properties:\n' +
      '- `name`\n' +
      '- `topic`\n' +
      '- `nsfw`\n' +
      '- `parentID`\n' +
      '- `rateLimitPerUser`\n' +
      '- `bitrate` (voice)\n' +
      '- `userLimit` (voice)\n' +
      'Returns the channel\'s ID.')
    .withExample(
      '{channeledit;11111111111111111;{j;{"name": "super-cool-channel"}}}',
      '11111111111111111'
    )
    .whenArgs(0, Builder.errors.notEnoughArguments)
    .whenArgs('1-5', async function (subtag, context, args) {
      let channel = await Builder.util.parseChannel(context, args[0]);

      if (!channel)
        return Builder.errors.noChannelFound(subtag, context);

      const permission = channel.permissionsOf(context.authorizer);

      if (!permission.has('manageChannels'))
        return Builder.util.error(subtag, context, 'Author cannot edit this channel');

      const options = JSON.parse(args[1] || '{}');

      try {
        let fullReason = bu.formatAuditReason(context.user, context.scope.reason);
        await channel.edit(options, fullReason);
        if (!context.guild.channels.get(channel.id))
          context.guild.channels.add(channel);
        return channel.id;
      } catch (err) {
        console.error(err.stack);
        return Builder.util.error(subtag, context, 'Failed to edit channel: no perms');
      }
    })
    .whenDefault(Builder.errors.tooManyArguments)
    .build();
