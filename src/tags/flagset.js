/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:37:28
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-05-18 10:24:53
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.AutoTag('flagset')
        .withArgs(a => [a.require('code')])
        .withDesc('Returns `true` or `false`, depending on whether the specified case-sensitive flag code has been set or not.')
        .withExample(
        '{flag;a} {flag;_}',
        'Hello, -a world!',
        'world! Hello,'
        )
        .whenArgs('1', async function (_, context, args) {
            return context.flaggedInput[args[0]] !== undefined;
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();