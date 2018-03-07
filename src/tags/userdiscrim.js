/*
 * @Author: stupid cat
 * @Date: 2017-05-07 19:19:52
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 19:19:52
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
  Builder.AutoTag('userdiscrim')
    .withArgs(a => [a.optional('user'), a.optional('quiet')])
    .withDesc('Returns `user`\'s discriminator. `user` defaults to defaults to the user who executed the containing tag. ' +
      'If `quiet` is specified, if `user` can\'t be found it will simply return `user`')
    .withExample(
      'Your discrim is {userdiscrim}',
      'Your discrim is 1234'
    ).beforeExecute(Builder.util.processAllSubtags)
    .whenArgs('1-3', async function (params) {
      let quiet = bu.isBoolean(params.quiet) ? params.quiet : !!params.args[2],
        user = params.msg.author;

      if (params.args.length > 1)
        user = await bu.getUser(params.msg, params.args[1], quiet);

      if (user != null)
        return user.discriminator;

      if (quiet)
        return params.args[1];
    })
    .whenDefault(Builder.errors.tooManyArguments)
    .build();