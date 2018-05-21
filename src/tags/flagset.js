/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:37:28
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-05-21 14:34:37
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.AutoTag('flagset')
        .withArgs(a => [a.require('code')])
        .withDesc('Returns `true` or `false`, depending on whether the specified case-sensitive flag code has been set or not.')
        .withExample(
            '{flagset;a} {flagset;_}',
            'Hello, -a world!',
            'true false'
        )
        .whenArgs('1', async function (_, context, args) {
            return context.flaggedInput[args[0]] !== undefined;
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();