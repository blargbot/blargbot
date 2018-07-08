/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:47:15
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-04-27 13:14:24
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.APITag('guildmembers')
        .withDesc('Returns an array of user IDs of the members on the current guild.')
        .withExample(
            'This guild has {length;{guildmembers}} members.',
            'This guild has 123 members.'
        )
        .whenArgs(0, async (_, context) => JSON.stringify(context.guild.members.map(m => m.user.id)))
        .whenDefault(Builder.errors.tooManyArguments)
        .build();
