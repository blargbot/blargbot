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
        .withArgs(a => a.require('text'))
        .withDesc('Trims whitespace and newlines before and after `text`.')
        .withExample(
            'Hello {trim;{space;10}beautiful{space;10}} World',
            'Hello beautiful World'
        ).beforeExecute(Builder.util.processAllSubtags)
        .whenArgs('1', Builder.errors.notEnoughArguments)
        .whenArgs('2', async function (params) { return params.args[1].trim(); })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();