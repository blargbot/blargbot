const Builder = require('../structures/TagBuilder');

const typeMap = {
  'text': 0,
  'voice': 2,
  'category': 4
};

module.exports =
  Builder.APITag('channelsetperms')
    .withArgs(a => [
      a.require('channelid'),
      a.require('type'),
      a.require('itemid'),
      a.optional('allow'),
      a.optional('deny')
    ])
    .withDesc('Sets a channel with the given information.\n' +
      '`type` is either `member` or `role`, and `itemid` corresponds to the id of the member or role.\n' +
      'Provide `allow` and `deny` as numbers, which can be calculated [here](https://discordapi.com/permissions.html). ' +
      'If neither are provided, the permission overwrite will be deleted.\n' +
      'Returns the channel\'s ID.')
    .withExample(
      '{channelsetperms;11111111111111111;member;222222222222222222;1024;2048}',
      '11111111111111111'
    )
    .whenArgs(0, Builder.errors.notEnoughArguments)
    .whenArgs('1-5', async function (subtag, context, args) {
      let channel = Builder.util.parseChannel(context, args[0]);

      if (!channel)
        return Builder.util.error(subtag, context, 'Channel does not exist');

      const permission = channel.permissionsOf(context.authorizer);

      if (!permission.has('manageChannels'))
        return Builder.util.error(subtag, context, 'Author cannot edit this channel');

      const type = args[1].toLowerCase();
      if (!['member', 'role'].includes(type))
        return Builder.util.error(subtag, context, 'Type must be member or role');

      const itemId = args[2];
      const allow = args[3] || '';
      const deny = args[4] || '';

      try {
        let fullReason = bu.formatAuditReason(context.user, context.scope.reason);
        if (allow === null && deny === null) {
          await channel.deletePermission(itemId);
        } else {
          await channel.editPermission(itemId, allow, deny, type, fullReason);
        }
        return channel.id;
      } catch (err) {
        console.error(err.stack);
        return Builder.util.error(subtag, context, 'Failed to edit channel: no perms');
      }
    })
    .whenDefault(Builder.errors.tooManyArguments)
    .build();
