/*
 * @Author: stupid cat
 * @Date: 2017-05-21 00:22:32
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-21 00:54:08
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
  Builder.AutoTag('rolename')
    .withArgs(a => [a.require('role'), a.optional('quiet')])
    .withDesc('Returns `role`\'s name. ' +
      'If `quiet` is specified, if `role` can\'t be found it will simply return `role`')
    .withExample(
      'The admin role name is: {rolename;admin}.',
      'The admin role name is: Administrator.'
    ).beforeExecute(Builder.util.processAllSubtags)
    .whenArgs('1', Builder.errors.notEnoughArguments)
    .whenArgs('2-3', async function (params) {
      let quiet = bu.isBoolean(params.quiet) ? params.quiet : !!params.args[2],
        role = await bu.getRole(params.msg, params.args[1], quiet);

      if (role != null)
        return role.name;

      if (quiet)
        return params.args[1];
    })
    .whenDefault(Builder.errors.tooManyArguments)
    .build();