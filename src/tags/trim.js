/*
 * @Author: stupid cat
 * @Date: 2017-05-07 19:06:37
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 19:06:37
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.AutoTag('trim')
        .withArgs(a => a.required('text'))
        .withDesc('Trims whitespace and newlines before and after `text`.')
        .withExample(
            'Hello {trim;{space;10}beautiful{space;10}} World',
            'Hello beautiful World'
        )
        .whenArgs(0, Builder.errors.notEnoughArguments)
        .whenArgs(1, async function (subtag, context, args) { return args[0].trim(); })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();