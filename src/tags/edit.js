/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:33:45
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:34:15
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
  Builder.CCommandTag('edit')
    .requireStaff()
    .withArgs(a => [a.optional('channelId'), a.require('messageId'), a.require([a.optional('text'), a.optional('embed')])])
    .withDesc('Edits `messageId` in `channelId` to say `text` or `embed`. ' +
      'Atleast one of `text` and `embed` is required. ' +
      'If `channelId` is not supplied, it defaults to the current channel. ' +
      'Only messages created by the bot may be edited')
    .withExample(
      'A message got edited: {edit;111111111111111111;New content}',
      '(the message got edited idk how to do examples for this)'
    ).beforeExecute(Builder.util.processAllSubtags)
    .whenArgs('1-2', Builder.errors.notEnoughArguments)
    .whenArgs('3', async function (params) { //params.args = ["edit",<messageId>,<text|embed>]
      let message = params.args[2],
        embed = bu.parseEmbed(params.args[2]);

      if (embed != null && !embed.malformed)
        message = undefined; //params.args = ["edit",<messageId>,<embed>]
      else
        embed = undefined; //params.args = ["edit",<messageId>,<text>]

      return await this.runEdit(params, params.msg.channel, params.args[1], message, embed);
    })
    .whenArgs('4', async function (params) { //params.args = ["edit",(<messageId>,<text>,<embed>)|(<channelid>,<messageId>,<text|embed>)]

      let channel = bu.parseChannel(params.args[1], true);
      if (channel == null) { //params.args = ["edit",<messageId>,<text>,<embed>]
        let text = params.args[2],
          embed = bu.parseEmbed(params.args[3]);
        return await this.runEdit(params, params.msg.channel, params.args[1], text, embed);
      }

      let text = params.args[3],
        embed = bu.parseEmbed(params.args[3]);

      if (embed != null && !embed.malformed)
        text = null; //params.args = ["edit",<channelId>,<messageId>,<embed>]
      else
        embed = null; //params.args = ["edit",<channelId>,<messageId>,<text>]
      return await this.runEdit(params, channel, params.args[2], text, embed);
    })
    .whenArgs('5', async function (params) { //params.args = ["edit",<channelId>,<messageId>,<text>,<embed>]
      let channel = bu.parseChannel(params.args[1], true),
        messageId = params.args[2],
        text = params.args[3],
        embed = bu.parseEmbed(params.args[4]);
      return await this.runEdit(params, channel, messageId, text, embed);
    })
    .whenDefault(Builder.errors.tooManyArguments)
    .withProp('runEdit', async function (params, channel, messageId, text, embed) {
      if (channel == null)
        return await Builder.errors.noChannelFound(params);
      if (!channel.guild || !params.msg.guild || channel.guild.id != params.msg.guild.id)
        return await Builder.errors.channelNotInGuild(params);

      let message = await bot.getMessage(channel.id, messageId);

      if (message == null) return await Builder.errors.noMessageFound(params);
      if (message.author.id != bot.user.id) return await Builder.util.error(params, 'I must be the message author');

      if ((text == null || text.trim() == '') && embed == null)
        return await Builder.util.error(params, 'Message cannot be empty');

      try {
        if (message.edit)
          message.edit({
            content: text || message.content,
            embed: embed || message.embeds[0]
          });
      } catch (err) { }
    })
    .build();