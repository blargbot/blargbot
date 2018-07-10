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
    Builder.APITag('categories')
        .withDesc('Returns an array of category IDs on the current guild.')
        .withExample(
            'This guild has {length;{categories}} categories.',
            'This guild has 7 categories.'
        )
        .whenArgs(0, async (_, context) => JSON.stringify(context.guild.channels.filter(c => c.type == 4).map(c => c.id)))
        .whenDefault(Builder.errors.tooManyArguments)
        .build();
