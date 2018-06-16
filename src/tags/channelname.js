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
        .withDesc('Returns the name of the current channel.')
        .withExample(
            'This channel\'s name is {channelname}',
            'This channel\'s name is test-channel'
        )
        .whenArgs(0, async (_, context) => context.channel.name)
        .whenDefault(Builder.errors.tooManyArguments)
        .build();