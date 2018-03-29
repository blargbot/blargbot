/*
 * @Author: stupid cat
 * @Date: 2017-05-07 19:19:31
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 19:19:31
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.AutoTag('uriencode')
        .withArgs(a => a.require('text'))
        .withDesc('Encodes `text` in URI format. Useful for constructing links.')
        .withExample(
            '{uriencode;Hello world!}',
            'Hello%20world!'
        )
        .whenArgs(0, Builder.errors.notEnoughArguments)
        .whenArgs(1, async function (subtag, context, args) {
            return encodeURIComponent(args[0]);
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();