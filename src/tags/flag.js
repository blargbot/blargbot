/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:37:28
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-05-21 14:34:25
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.AutoTag('flag')
        .withArgs(a => [a.require('code')])
        .withDesc('Returns the value of the specified case-sensitive flag code. Use `_` to get the values without a flag.')
        .withExample(
            '{flag;a} {flag;_}',
            'Hello, -a world!',
            'world! Hello,'
        )
        .whenArgs(0, Builder.errors.notEnoughArguments)
        .whenArgs('1', async function (_, context, args) {
            return context.flaggedInput[args[0]];
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();