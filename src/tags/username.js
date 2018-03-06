/*
 * @Author: stupid cat
 * @Date: 2017-05-07 19:20:42
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 19:20:42
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
  Builder.AutoTag('username')
    .withArgs(a => [a.optional('user'), a.optional('quiet')])
    .withDesc('Returns the user\'s name. If `user` is specified, gets that user instead. ' +
      'If `quiet` is specified, if a user can\'t be found it will simply return the `user`')
    .withExample(
      'Your username is {username}!',
      'Your username is user!'
    ).beforeExecute(Builder.util.processAllSubtags)
    .whenArgs('1-3', async function (params) {
      let quiet = bu.isBoolean(params.quiet) ? params.quiet : !!params.args[2],
        user = await bu.getUser(params.msg, params.args[1], quiet);
      if (user != null)
        return user.username;

      if (quiet)
        return params.args[1];
    })
    .whenDefault(Builder.errors.tooManyArguments)
    .build();