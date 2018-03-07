/*
 * @Author: stupid cat
 * @Date: 2017-05-07 19:19:26
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 19:19:26
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.AutoTag('upper')
        .withArgs(a => a.require('text'))
        .withDesc('Returns `text` as uppercase.')
        .withExample(
            '{upper;this will become uppercase}',
            'THIS WILL BECOME UPPERCASE'
        ).beforeExecute(Builder.util.processAllSubtags)
        .whenArgs('1', Builder.errors.notEnoughArguments)
        .whenArgs('2', async function (params) {
            return params.args[1].toUpperCase();
         })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();