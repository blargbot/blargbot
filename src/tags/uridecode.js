/*
 * @Author: stupid cat
 * @Date: 2017-05-07 19:19:31
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-09-25 08:59:26
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.AutoTag('uridecode')
        .withArgs(a => a.required('text'))
        .withDesc('Decodes `text` from URI format.')
        .withExample(
            '{uridecode;Hello%20world}',
            'Hello world!'
        )
        .whenArgs(0, Builder.errors.notEnoughArguments)
        .whenArgs(1, async function (subtag, context, args) {
            return decodeURIComponent(args[0]);
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();