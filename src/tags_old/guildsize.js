/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:47:15
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-04-27 13:12:24
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.APITag('guildsize')
        .withAlias('inguild')
        .withDesc('Returns the number of members on the current guild.')
        .withExample(
            'This guild has {guildsize} members.',
            'This guild has 123 members.'
        )
        .whenArgs(0, async (_, context) => context.guild.memberCount)
        .whenDefault(Builder.errors.tooManyArguments)
        .build();