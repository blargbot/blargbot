/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:26:45
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:26:45
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.AutoTag('argslength')
        .withDesc('Return the number of arguments the user provided.')
        .withExample(
            'You said {argslength} words.',
            'I am saying things.',
            'You said 4 words.'
        )
        .whenArgs(0, async (_, context) => context.input.length.toString())
        .whenDefault(Builder.errors.tooManyArguments)
        .build();