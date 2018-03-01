/*
 * @Author: stupid cat
 * @Date: 2017-05-21 00:22:32
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-28 13:31:31
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
  Builder.AutoTag('rolemembers')
    .withArgs(a => [a.require('role'), a.optional('quiet')])
    .withDesc('Returns an array of members in the specified role. ' +
      'If `quiet` is specified, if a role can\'t be found it will simply return the `role`')
    .withExample(
      'The admins are: {rolemembers;Admin}.',
      'The admins are: ["11111111111111111","22222222222222222"].'
    ).beforeExecute(Builder.util.processAllSubtags)
    .whenArgs('1', Builder.errors.notEnoughArguments)
    .whenArgs('2-3', async function (params) {
      let role = await bu.getRole(params.msg, params.args[1], params.args[2]);

      if (role != null)
        return JSON.stringify(params.msg.guild.members
          .filter(m => m.roles.includes(role.id))
          .map(m => m.user.id));

      if (params.args[2])
        return params.args[1];
      return '';
    })
    .whenDefault(Builder.errors.tooManyArguments)
    .build();