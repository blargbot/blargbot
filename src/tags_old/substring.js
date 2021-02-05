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
        .withDesc('Returns all text from `text` between the `start` and `end`. ' +
            '`end` defaults to the length of text.')
        .withExample(
            'Hello {substring;world;2;3}!',
            'Hello r!'
        )
        .whenArgs('0-1', Builder.errors.notEnoughArguments)
        .whenArgs('2-3', async function (subtag, context, args) {
            let fallback = bu.parseInt(context.scope.fallback),
                text = args[0],
                start = bu.parseInt(args[1]),
                end = bu.parseInt(args[2] || text.length);

            if (isNaN(start)) start = fallback;
            if (isNaN(end)) end = fallback;
            if (isNaN(start) || isNaN(end))
                return Builder.errors.notANumber(subtag, context);

            return text.substring(start, end);
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();