/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:30:19
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:30:19
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.APITag('channelname')
        .withArgs(a => [a.optional('channelid')])
        .withDesc('Returns the name of the given channel. If no channelid is given, the current channels name will be returned.')
        .withExample(
            'This channel\'s name is {channelname}',
            'This channel\'s name is test-channel'
        )
        .whenArgs(0, async (_, context) => context.channel.name)
        .whenArgs(1, async (_, context, args) => {
            context.guild.channels.foreach(c => {
                if (c.id == args[0]) return (c.name || '');
            });
            return `Channel not found.`;
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();
