/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:50:20
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:50:20
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
  Builder.AutoTag('isnsfw')
    .withArgs(a => a.optional('channelId'))
    .withDesc('Checks if `channelId` is a NSFW channel. `channelId` defaults to the current channel')
    .withExample(
      '{if;{isnsfw};Spooky nsfw stuff;fluffy bunnies}',
      'fluffy bunnies'
    ).beforeExecute(Builder.util.processAllSubtags)
    .whenArgs('1-2', async function (params) {
      let channel = params.msg.channel;
      if (params.args.length == 2)
        channel = bu.parseChannel(params.args[1], true);

      if (channel == null) return await Builder.errors.noChannelFound(params);

      return await bu.isNsfwChannel(channel.id);
    })
    .whenDefault(Builder.errors.tooManyArguments)
    .build();