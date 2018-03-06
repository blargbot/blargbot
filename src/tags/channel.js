/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:30:03
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-10-16 12:10:03
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
  Builder.CCommandTag('channel')
    .isDepreciated().requireStaff()
    .withArgs(a => [a.require('channel'), a.optional('message')])
    .withDesc('Please use the {send} subtag instead of this.\n' +
      'Sends the output to `channel`. ' +
      'If `message` is specified, it will send `message` in the specified channel instead of rerouting output.')
    .withExample(
      '{channel;#channel}Hello!',
      'In #channel: Hello!'
    ).beforeExecute(Builder.util.processAllSubtags)
    .whenArgs('1', Builder.errors.notEnoughArguments)
    .whenArgs('2-3', async function (params) {
      let channel = bu.parseChannel(params.args[1], true),
        message = params.args[2];

      if (channel == null) return await Builder.errors.noChannelFound(params);
      if (channel.guild.id != params.msg.guild.id) return await Builder.errors.channelNotInGuild(params);

      if (params.args.length == 2)
        params.msg.channel = channel;
      else
        bu.send(channel.id, {
          content: params.args[2],
          disableEveryone: false
        });
    }).whenDefault(Builder.errors.tooManyArguments)
    .build();