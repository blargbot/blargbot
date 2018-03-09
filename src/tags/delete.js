/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:31:02
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:31:02
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

async function deleteMessage(params, channelId, messageId) {
  let msg = params.msg,
    channel = Builder.util.parseChannel(params, channelId);

  if (typeof channel === 'function')
    return await channel(params);

  if (msg.id !== messageId)
    try {
      msg = await bot.getMessage(channel.id, messageId);
    } catch (err) {
      return await Builder.errors.noMessageFound(params);
    }

  try {
    if (msg != null)
      msg.delete();
  } catch (e) {
  }
}

module.exports =
  Builder.AutoTag('delete')
    .requireStaff()
    .withArgs(a => a.optional([a.optional('channelId'), a.require('messageId')]))
    .withDesc('Deletes the specified `messageId` from `channelId`, defaulting to the message that invoked the command. ' +
      'If `channelId` is not provided, it defaults to the current channel. ' +
      'Only ccommands can delete other messages.')
    .withExample(
      'The message that triggered this will be deleted. {delete}',
      '(the message got deleted idk how to do examples for this)'
    ).beforeExecute(Builder.util.processAllSubtags)
    .whenArgs('1', async params => await deleteMessage(params, params.msg.channel.id, params.msg.id))
    .whenArgs('2', async params => await deleteMessage(params, params.msg.channel.id, params.args[1]))
    .whenArgs('3', async params => await deleteMessage(params, params.args[1], params.args[2]))
    .whenDefault(Builder.errors.tooManyArguments)
    .build();