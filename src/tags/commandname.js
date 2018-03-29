/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:30:37
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:30:37
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.AutoTag('commandname')
        .withDesc('Gets the name of the current tag or custom command. Will throw an error in other instances.')
        .withExample(
            'This command is {commandname}',
            'This command is test'
        )
        .whenArgs(0, async (subtag, context) => context.tagName || Builder.util.error(subtag, context, 'Not a command'))
        .whenDefault(Builder.errors.tooManyArguments)
        .build();