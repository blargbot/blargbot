/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:30:08
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-10-16 12:10:59
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */


const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.APITag('channelid')
        .withDesc('Returns the ID of the current channel.')
        .withExample(
            'This channel\'s id is {channelid}',
            'This channel\'s id is 1234567890123456'
        )
        .whenArgs(0, async (_, context) => context.channel.id)
        .whenDefault(Builder.errors.tooManyArguments)
        .build();