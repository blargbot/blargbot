/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:25:36
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:25:36
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
  Builder.CCommandTag('addrole')
    .requireStaff()
    .withArgs(a => [a.require('role'), a.optional('user'), a.optional('quiet')])
    .withDesc('Gives a user a role, where role is a role ID or mention. ' +
      'You can find a list of roles and their ids by doing `b!roles`. ' +
      'Returns true if a role was given, and false otherwise.' +
      'If `quiet` is specified, if a user can\'t be found it will simply return `false`'
    ).withExample(
      'Have a role! {addrole;11111111111111111}',
      'Have a role! true'
    ).beforeExecute(Builder.util.processAllSubtags)
    .whenArgs('<2', Builder.errors.notEnoughArguments)
    .whenArgs('2-3', async function (params) {
      let result = await TagManager.list['hasrole'].checkRoles(params, ...params.args.slice(1, 4));

      if (result.user == null) {
        if (params.args[3])
          return false;
        return await Builder.errors.noUserFound(params);
      }
      if (result.roles.length == 0)
        return await Builder.errors.noRoleFound(params);

      let roles = result.roles.filter((e, i) => !result.hasRole[i]);
      if (roles.length == 0)
        return 'false';

      try {
        for (const role of roles)
          await result.user.addRole(role.id);
        return 'true';
      } catch (err) {
        console.error(err);
        return 'false';
      }
    })
    .whenDefault(Builder.errors.tooManyArguments)
    .build();