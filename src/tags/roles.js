/*
 * @Author: stupid cat
 * @Date: 2017-05-21 00:22:32
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-21 00:44:23
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
  Builder.AutoTag('roles')
    .withArgs(a => [a.optional('user'), a.optional('quiet')])
    .withDesc('Returns an array of roles on the current guild. ' +
      'If `user` is specified, get the roles that `user` has. ' +
      'If `quiet` is specified, if a `user` can\'t be found it will simply return `user`')
    .withExample(
      'The roles on this guild are: {roles}.',
      'The roles on this guild are: ["11111111111111111","22222222222222222"].'
    ).beforeExecute(Builder.util.processAllSubtags)
    .whenArgs('1', async function (params) {
      return JSON.stringify(params.msg.guild.roles.map(r => r.id));
    })
    .whenArgs('2-3', async function (params) {
      let quiet = bu.isBoolean(params.quiet) ? params.quiet : !!params.args[2],
      user = await bu.getUser(params.msg, params.args[1], quiet);

      if (user != null)
        return JSON.stringify(params.msg.guild.members.get(user.id).roles);

      if (quiet)
        return params.args[1];
    })
    .whenDefault(Builder.errors.tooManyArguments)
    .build();