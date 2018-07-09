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
    Builder.APITag('channelpos')
        .withArgs(a => [a.optional('channelid')])
        .withDesc('Returns the position of the current channel. If no channelid is given, the current channels position will be returned.')
        .withExample(
            'This channel is in position {channelpos}',
            'This channel is in position 1'
        )
        .whenArgs(0, async (_, context) => context.channel.position)
        .whenArgs(1, async (_, context, args) => {
            let i = context.guild.channels.findIndex(c => c.id == args[0]);
            return i >= 0 ? i : `Channel not found.`;
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();
