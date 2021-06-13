const Builder = require('../structures/TagBuilder');

const typeMap = {
  'text': 0,
  'voice': 2,
  'category': 4
};

module.exports =
  Builder.APITag('channeldelete')
    .withArgs(a => [
      a.require('id')
    ])
    .withDesc('Deletes the provided channel.')
    .withExample(
      '{channeldelete;11111111111111111}',
      ''
    )
    .whenArgs(0, Builder.errors.notEnoughArguments)
    .whenArgs('1', async function (subtag, context, args) {
      let channel = await Builder.util.parseChannel(context, args[0]);

      if (!channel)
        return Builder.errors.noChannelFound(subtag, context);
      const permission = channel.permissionsOf(context.authorizer);

      if (!permission.has('manageChannels'))
        return Builder.util.error(subtag, context, 'Author cannot edit this channel');


      try {
        let fullReason = bu.formatAuditReason(context.user, context.scope.reason);
        await channel.delete(fullReason);
        if (context.guild.channels.get(channel.id))
          context.guild.channels.remove(channel);
      } catch (err) {
        console.error(err.stack);
        return Builder.util.error(subtag, context, 'Failed to edit channel: no perms');
      }
    })
    .whenDefault(Builder.errors.tooManyArguments)
    .build();

