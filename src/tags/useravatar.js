/*
 * @Author: stupid cat
 * @Date: 2017-05-07 19:19:37
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 19:19:37
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
  Builder.AutoTag('useravatar')
    .withArgs(a => [a.optional('user'), a.optional('quiet')])
    .withDesc('Returns the avatar of `user`. `user` defaults to the user who executed the containing tag. ' +
      'If `quiet` is specified, if `user` can\'t be found it will simply return `user`')
    .withExample(
      'Your avatar is {useravatar}',
      'Your avatar is (avatar url)'
    ).beforeExecute(Builder.util.processAllSubtags)
    .whenArgs('1-3', async function (params) {
      let quiet = bu.isBoolean(params.quiet) ? params.quiet : !!params.args[2],
        user = await bu.getUser(params.msg, params.args[1], quiet);
      if (user != null)
        return user.avatarURL;

      if (quiet)
        return params.args[1];
    })
    .whenDefault(Builder.errors.tooManyArguments)
    .build();