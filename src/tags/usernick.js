/*
 * @Author: stupid cat
 * @Date: 2017-05-07 19:20:48
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 19:20:48
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
  Builder.AutoTag('usernick')
    .withArgs(a => [a.optional('user'), a.optional('quiet')])
    .withDesc('Returns the user\'s nickname. If it doesn\'t exist, returns their username instead. '+
    'If `user` is specified, gets that user instead. '+
    'If `quiet` is specified, if a user can\'t be found it will simply return the `user`')
    .withExample(
      'Your nick is {usernick}!',
      'Your nick is Cool Dude 1337!'
    ).beforeExecute(Builder.util.processAllSubtags)
    .whenArgs('1-3', async function (params) {
      let user = await bu.getUser(params.msg, params.args[1], params.args[2]);
      if (user != null) {
        let member = params.msg.channel.guild.members.get(user.id);
        return member.nick || user.username;
      }

      if (params.args[2])
        return params.args[1];
      return '';
    })
    .whenDefault(Builder.errors.tooManyArguments)
    .build();