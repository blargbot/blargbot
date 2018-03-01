/*
 * @Author: stupid cat
 * @Date: 2017-05-07 19:00:43
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 19:01:43
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.AutoTag('substring')
        .withArgs(a => [a.require('text'), a.require('start'), a.optional('end')])
        .withDesc('Returns a chunk of text between the start and end indexes. ' +
            'If end is not specified, it assumes the length of the text.')
        .withExample(
            'Hello {substring;world;2;3}!',
            'Hello r!'
        ).beforeExecute(Builder.util.processAllSubtags)
        .whenArgs('1-2', Builder.errors.notEnoughArguments)
        .whenArgs('3-4', async function (params) {
            let fallback = parseInt(params.fallback),
                text = params.args[1],
                start = parseInt(params.args[2]),
                end = parseInt(params.args[3] || text.length);

            if (isNaN(start)) start = fallback;
            if (isNaN(end)) end = fallback;
            if (isNaN(start) || isNaN(end))
                return await Builder.errors.notANumber(params);

            return text.substring(start, end);
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();