/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:53:27
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:54:01
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
  Builder.CCommandTag('removerole')
    .requireStaff()
    .withArgs(a => [a.require('role'), a.optional('user'), a.optional('quiet')])
    .withDesc('Removes `role` from `user`, where `role` is a role ID or mention. ' +
      'You can find a list of roles and their ids by doing \`b!roles\`. ' +
      'Returns true if `role` was removed, and false otherwise.' +
      'If `quiet` is specified, if a user can\'t be found it will simply return `false`'
    ).withExample(
      'No more role! {removerole;11111111111111111}',
      'No more role! true'
    ).beforeExecute(Builder.util.processAllSubtags)
    .whenArgs('1', Builder.errors.notEnoughArguments)
    .whenArgs('2-4', async function (params) {
      let quiet = bu.isBoolean(params.quiet) ? params.quiet : !!params.args[3],
        result = await TagManager.list['hasrole'].checkRoles(params, ...params.args.slice(1, 3), quiet);

      if (result.user == null) {
        if (quiet)
          return false;
        return await Builder.errors.noUserFound(params);
      }

      if (result.roles.length == 0)
        return await Builder.errors.noRoleFound(params);

      let roles = result.roles.filter((e, i) => result.hasRole[i]);
      if (roles.length == 0)
        return 'false';

      try {
        for (const role of roles)
          await result.user.removeRole(role.id);
        return 'true';
      } catch (err) {
        console.error(err);
        return 'false';
      }
    })
    .whenDefault(Builder.errors.tooManyArguments)
    .build();