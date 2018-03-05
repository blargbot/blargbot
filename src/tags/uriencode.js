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
        .withDesc('Encodes a chunk of text in URI format. Useful for constructing links.')
        .withExample(
            '{uriencode;Hello world!}',
            'Hello%20world!'
        ).beforeExecute(Builder.util.processAllSubtags)
        .whenArgs('1', Builder.errors.notEnoughArguments)
        .whenArgs('2', async function (params) {
            return encodeURIComponent(params.args[1]);
         })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();