/*
 * @Author: stupid cat
 * @Date: 2017-05-07 19:20:55
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 19:20:55
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
  Builder.AutoTag('userstatus')
    .withArgs(a => [a.optional('user'), a.optional('quiet')])
    .withDesc('Returns the status of `user` (`online`, `idle`, `dnd`, or `offline`). ' +
      '`user` defaults to the user who executed the containing tag. ' +
      'If `quiet` is specified, if `user` can\'t be found it will simply return `user`')
    .withExample(
      'You are currently {userstatus}',
      'You are currently online'
    ).beforeExecute(Builder.util.processAllSubtags)
    .whenArgs('1-3', async function (params) {
      let quiet = bu.isBoolean(params.quiet) ? params.quiet : !!params.args[2],
        user = params.msg.author;

      if (params.args[1])
        user = await bu.getUser(params.msg, params.args[1], quiet);

      if (user != null) {
        let member = params.msg.channel.guild.members.get(user.id);
        if (member != null)
          return member.status;
      }

      if (quiet)
        return params.args[1];
    })
    .whenDefault(Builder.errors.tooManyArguments)
    .build();