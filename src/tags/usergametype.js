/*
 * @Author: stupid cat
 * @Date: 2017-05-07 19:20:02
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 19:20:02
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder'),
  gameTypes = {
    default: '',
    0: 'playing',
    1: 'streaming'
  };

module.exports =
  Builder.AutoTag('usergametype')
    .withArgs(a => [a.optional('user'), a.optional('quiet')])
    .withDesc('Returns how the user is playing the game (playing, streaming). ' +
      'If `user` is specified, gets that user instead. ' +
      'If `quiet` is specified, if a user can\'t be found it will simply return the `user`')
    .withExample(
      'You are {usergametype} right now!',
      'You are playing right now!'
    ).beforeExecute(Builder.util.processAllSubtags)
    .whenArgs('1-3', async function (params) {
      let user = await bu.getUser(params.msg, params.args[1], params.args[2]);

      if (user != null)
        return gameTypes[user.game || { type: -1 }] || gameTypes.default;

      if (params.args[2])
        return params.args[1];
    })
    .whenDefault(Builder.errors.tooManyArguments)
    .build();