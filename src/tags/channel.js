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
      'Sends the output to a specific channel. ' +
      'Only works in custom commands. ' +
      'If a message is specified, it will create a new message in the specified channel instead of rerouting output.')
    .withExample(
      '{channel;#channel}Hello!',
      'In #channel: Hello!'
    ).beforeExecute(Builder.util.processAllSubtags)
    .whenArgs('1', Builder.errors.notEnoughArguments)
    .whenArgs('2-3', async function(params) {
      if (/([0-9]{17,23})/.test(params.args[1])) {
        let channelid = params.args[1].match(/([0-9]{17,23})/)[1];
        let channel = bot.getChannel(channelid);
        if (channel) {
          if (channel.guild.id == params.msg.guild.id) {
            if (params.args[2]) {
              bu.send(channel.id, {
                content: params.args[2],
                disableEveryone: false
              });
            }
            else
              params.msg.channel = channel;
            return '';
          } else {
            return await Builder.util.error(params, 'Channel must be in guild');
          }
        } else {
          return await Builder.errors.noChannelFound(params);
        }
      } else {
        return await Builder.errors.noChannelFound(params);
      }
    }).whenDefault(Builder.errors.tooManyArguments)
    .build();