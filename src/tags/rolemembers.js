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
    .withDesc('Returns an array of members in `role`. ' +
      'If `quiet` is specified, if `role` can\'t be found it will simply return `role`')
    .withExample(
      'The admins are: {rolemembers;Admin}.',
      'The admins are: ["11111111111111111","22222222222222222"].'
    ).beforeExecute(Builder.util.processAllSubtags)
    .whenArgs('1', Builder.errors.notEnoughArguments)
    .whenArgs('2-3', async function (params) {
      let quiet = bu.isBoolean(params.quiet) ? params.quiet : !!params.args[2],
        role = await bu.getRole(params.msg, params.args[1], quiet);

      if (role != null)
        return JSON.stringify(params.msg.guild.members
          .filter(m => m.roles.includes(role.id))
          .map(m => m.user.id));

      if (quiet)
        return params.args[1];
    })
    .whenDefault(Builder.errors.tooManyArguments)
    .build();