/*
 * @Author: zoomah
 * @Date: 2018-07-10 7:08:15
 * @Last Modified by: zoomah
 * @Last Modified time: 2018-07-10 7:08:15
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
