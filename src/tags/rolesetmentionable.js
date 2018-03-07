/*
 * @Author: stupid cat
 * @Date: 2017-05-21 00:22:32
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-07-13 10:50:58
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
  Builder.CCommandTag('rolesetmentionable')
    .requireStaff()
    .withArgs(a => [a.require('role'), a.optional('value'), a.optional('quiet')])
    .withDesc('Sets whether `role` can be mentioned. `value` can be either `true` to set the role as mentionable, ' +
      'or anything else to set it to unmentionable. If `value` isn\'t provided, defaults to `true`. ' +
      'If `quiet` is specified, if `role` can\'t be found it will simply return nothing')
    .withExample(
      'The admin role is now mentionable. {rolesetmentionable;admin;true}',
      'The admin role is now mentionable.'
    ).beforeExecute(Builder.util.processAllSubtags)
    .whenArgs('1', Builder.errors.notEnoughArguments)
    .whenArgs('2-4', async function (params) {
      let quiet = bu.isBoolean(params.quiet) ? params.quiet : !!params.args[3],
        role = await bu.getRole(params.msg, params.args[1], quiet),
        mentionable = bu.parseBoolean(params.args[2], true);

      if (role != null) {
        try {
          await role.edit({ mentionable });
          return;
        } catch (err) {
          if (!quiet)
            return await Builder.util.error(params, 'Failed to edit role: no perms');
        }
      }
      return await Builder.util.error(params, 'Role not found');
    })
    .whenDefault(Builder.errors.tooManyArguments)
    .build();