/*
 * @Author: stupid cat
 * @Date: 2017-05-21 00:22:32
 * @Last Modified by: stupid cat
 * @Last Modified time: 2019-09-26 09:29:09
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const snekfetch = require('snekfetch');
const Builder = require('../structures/TagBuilder');

module.exports =
  Builder.APITag('emojicreate')
      .withArgs(a => [
          a.required('name'),
          a.required('image'),
          a.optional('roles')
      ])
      .withDesc('Creates a emoji with the given name and image. ' +
      '`image` is either a link to an image, or a base64 encoded data url (`data:<content-type>;base64,<base64-data>`). You may need to use {semi} for the latter.' +
      '`roles`, if provided, will restrict the emoji\'s usage to the specified roles' +
      'Returns the new emojis\'s ID.')
      .withExample(
          '{emojicreate;fancy_emote;https://some.cool/image.png}',
          '11111111111111111'
      )
      .whenArgs('0-1', Builder.errors.notEnoughArguments)
      .whenArgs('2-3', async function (subtag, context, args) {
          let permission = Builder.util.getPerms(context);

          if (!permission.has('manageEmojis')) {
              return Builder.util.error(subtag, context, 'Author cannot create emojis');
          }

          let options = {
              name: args[0],
              image: args[1] || '',
              roles: []
          };

          const roleQueries = await bu.getArray(context, args[2]) || [];
          if (roleQueries) {
              for (const query of (roleQueries.v || roleQueries)) {
                  const role = await context.getRole(query, {
                      quiet: true, suppress: true,
                      label: `${context.isCC ? 'custom command' : 'tag'} \`${context.tagName || 'unknown'}\``
                  });

                  if (role) {
                      options.roles.push(role.id);
                  }
              }
          }

          if (!options.name) {
              return Builder.util.error(subtag, context, 'Name was not provided');
          }

          if (/^https?:\/\//i.test(options.image)) {
              const res = await snekfetch.get(options.image);
              options.image = `data:${res.headers['content-type']};base64,${res.body.toString('base64')}`;
          } else if (!options.image.startsWith('data:')) {
              return Builder.util.error(subtag, context, 'Image was not a buffer or a URL');
          }

          try {

              let fullReason = bu.formatAuditReason(context.user, context.scope.reason);
              const emoji = await context.guild.createEmoji(options, fullReason);
              return emoji.id;
          } catch (err) {
              console.error(err.stack);
              const parts = err.message.split('\n').map(m => m.trim());
              return Builder.util.error(subtag, context, 'Failed to create emoji: ' + (parts[1] || parts[0]));
          }
      })
      .whenDefault(Builder.errors.tooManyArguments)
      .build();
