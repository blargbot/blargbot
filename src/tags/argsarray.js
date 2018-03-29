/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:26:17
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-01-26 11:04:45
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.AutoTag('argsarray')
        .withDesc('Gets user input as an array.')
        .withExample(
            'Your input was {argsarray}',
            'Hello world!',
            'Your input was ["Hello","world!"]'
        )
        .whenArgs(0, async (_, context) => JSON.stringify(context.input))
        .whenDefault(Builder.errors.tooManyArguments)
        .build();