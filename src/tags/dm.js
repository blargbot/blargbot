/*
 * @Author: stupid cat
 * @Date: 2017-05-21 12:20:00
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-21 13:44:19
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder'),
  DMCache = {};

module.exports =
  Builder.CCommandTag('dm')
    .requireStaff()
    .withArgs(a => [a.require('user'), a.require('message')])
    .withDesc('DMs `user` the given `message`. You may only send one DM per execution. Requires author to be staff, and the user to be on the current guild.'
    ).withExample(
      '{dm;stupid cat;Hello}',
      'DM: Hello'
    ).beforeExecute(Builder.util.processAllSubtags)
    .whenArgs('1-2', Builder.errors.notEnoughArguments)
    .whenArgs('3', async function(params) {
      if (params.msg.hasDmed)
        return await Builder.util.error(params, 'Already have DMed');

      let user = await bu.getUser(params.msg, params.args[1]);
      if (user == null)
        return await Builder.errors.noUserFound(params);
      if (!params.msg.guild.members.get(user.id))
        return await Builder.errors.userNotInGuild(params);

      try {
        const DMChannel = await user.getDMChannel();
        if (!DMCache[user.id] ||
          DMCache[user.id].count > 5 ||
          DMCache[user.id].user != params.msg.author.id ||
          DMCache[user.id].guild != params.msg.guild.id) {
          // Ew we're gonna send a message first? It was voted...
          await bu.send(DMChannel.id, 'The following message was sent from ' +
            `**__${params.msg.guild.name}__** (${params.msg.guild.id}), ` +
            'and was sent by ' +
            `**__${bu.getFullName(params.msg.author)}__** (${params.msg.author.id}):`
          );
          DMCache[user.id] = { user: params.msg.author.id, guild: params.msg.guild.id, count: 1 };
        }
        await bu.send(DMChannel.id, params.args[2]);
        DMCache[user.id].count++;
      } catch (e) {
        return await Builder.util.error(params, 'Could not send DM');
      }
    }).whenDefault(Builder.errors.tooManyArguments)
    .build();