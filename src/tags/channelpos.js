/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:30:28
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:30:28
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
  Builder.SimpleTag('channelpos')
  .withDesc('Returns the position of the current channel.')
  .withExample(
    'This channel is in position {channelpos}',
    'This channel is in position 1'
  ).whenArgs('1', async params => params.msg.channel.position)
  .whenDefault(Builder.defaults.tooManyArguments)
  .build();