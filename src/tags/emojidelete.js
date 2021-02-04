/*
 * @Author: stupid cat
 * @Date: 2017-05-21 00:22:32
 * @Last Modified by: stupid cat
 * @Last Modified time: 2019-09-26 09:29:09
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');
const snekfetch = require('snekfetch');

module.exports =
  Builder.APITag('emojidelete')
    .withArgs(a => [
      a.require('id')
    ])
    .withDesc('Deletes an emoji with the provided id.')
    .withExample(
      '{emojidelete;11111111111111111}',
      ''
    )
    .whenArgs(0, Builder.errors.notEnoughArguments)
    .whenArgs(1, async function (subtag, context, args) {
      let permission = Builder.util.getPerms(context);

      if (!permission.has('manageEmojis')) {
        return Builder.util.error(subtag, context, 'Author cannot delete emojis');
      }

      let id = args[0];

      try {

        let fullReason = bu.formatAuditReason(context.user, context.scope.reason);
        await context.guild.deleteEmoji(id, fullReason);
      } catch (err) {
        console.error(err.stack);
        const parts = err.message.split('\n').map(m => m.trim());
        return Builder.util.error(subtag, context, 'Failed to delete emoji: ' + (parts[1] || parts[0]));
      }
    })
    .whenDefault(Builder.errors.tooManyArguments)
    .build();

