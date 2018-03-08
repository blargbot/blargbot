/*
 * @Author: stupid cat
 * @Date: 2017-05-07 19:20:35
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 19:20:35
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
  Builder.CCommandTag('usermention')
    .withArgs(a => [a.optional('user'), a.optional('quiet')])
    .withDesc('Mentions `user`. `user` defaults to the user who executed the containing tag. ' +
      'If `quiet` is specified, if `user` can\'t be found it will simply return `user`')
    .withExample(
      'Hello, {usermention}!',
      'Hello, @user!'
    ).beforeExecute(Builder.util.processAllSubtags)
    .whenArgs('1-3', async function (params) {
      let quiet = bu.isBoolean(params.quiet) ? params.quiet : !!params.args[2],
        user = params.msg.author;

      if (params.args[1])
        user = await bu.getUser(params.msg, params.args[1], quiet);

      if (user != null)
        return user.mention;

      if (quiet)
        return params.args[1];
    })
    .whenDefault(Builder.errors.tooManyArguments)
    .build();