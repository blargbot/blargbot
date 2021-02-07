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
  Builder.APITag('guildseticon')
    .withArgs(a => [
      a.require('image')
    ])
    .withDesc('Updates the current guild\'s icon with the provided image. ' +
      '`image` is either a link to an image, or a base64 encoded data url (`data:<content-type>;base64,<base64-data>`). You may need to use {semi} for the latter.')
    .withExample(
      '{guildseticon;https://some.cool/image.png}',
      ''
    )
    .whenArgs(0, Builder.errors.notEnoughArguments)
    .whenArgs(1, async function (subtag, context, args) {
      let permission = Builder.util.getPerms(context);

      if (!permission.has('manageGuild')) {
        return Builder.util.error(subtag, context, 'Author cannot modify the guild');
      }

      let image = args[0] || '';

      if (/^https?:\/\//i.test(image)) {
        const res = await snekfetch.get(image);
        image = `data:${res.headers['content-type']};base64,${res.body.toString('base64')}`;
      } else if (!image.startsWith('data:')) {
        return Builder.util.error(subtag, context, 'Image was not a buffer or a URL');
      }

      try {
        let fullReason = bu.formatAuditReason(context.user, context.scope.reason);
        await context.guild.edit({
          icon: image
        }, fullReason);
      } catch (err) {
        console.error(err.stack);
        const parts = err.message.split('\n').map(m => m.trim());
        return Builder.util.error(subtag, context, 'Failed to set icon: ' + (parts[1] || parts[0]));
      }
    })
    .whenDefault(Builder.errors.tooManyArguments)
    .build();

