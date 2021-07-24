const Builder = require('../structures/TagBuilder');

module.exports =
  Builder.APITag('channelsetpos')
    .withAlias('channelsetposition')
    .withArgs(a => [
      a.require('channelid'),
      a.require('position')
    ])
    .withDesc('Moves a channel to the provided position.')
    .withExample(
      '{channelsetpos;11111111111111111;5}',
      ''
    )
    .whenArgs('0-1', Builder.errors.notEnoughArguments)
    .whenArgs(2, async function (subtag, context, args) {
      let channel = await Builder.util.parseChannel(context, args[0], { suppress: context.scope.suppressLookup });

      if (!channel)
        return Builder.errors.noChannelFound(subtag, context);

      const permission = channel.permissionsOf(context.authorizer);

      if (!permission.has('manageChannels'))
        return Builder.util.error(subtag, context, 'Author cannot move this channel');

      let pos = bu.parseInt(args[1]);

      try {
        channel.editPosition(pos);
      } catch (err) {
        console.error(err.stack);
        return Builder.util.error(subtag, context, 'Failed to move channel: no perms');
      }
    })
    .whenDefault(Builder.errors.tooManyArguments)
    .build();
