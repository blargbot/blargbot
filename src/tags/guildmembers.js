/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:47:15
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:47:15
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.AutoTag('guildmembers')
        .withDesc('Returns the number of members on the current guild.')
        .withExample(
            'This guild has {guildmembers} members.',
            'This guild has 123 members.'
        )
        .whenArgs('0', async (_, context) => context.guild.memberCount)
        .whenDefault(Builder.errors.tooManyArguments)
        .build();