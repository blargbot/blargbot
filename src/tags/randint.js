/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:51:20
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:51:20
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.AutoTag('randint')
        .withArgs(a => [a.optional('min'), a.require('max')])
        .withDesc('Chooses a random whole number between two values (inclusive). `min` defaults to 0.')
        .withExample(
            'You rolled a {randint;1;6}.',
            'You rolled a 5.'
        ).beforeExecute(Builder.util.processAllSubtags)
        .whenArgs('1', Builder.errors.notEnoughArguments)
        .whenArgs('2-3', async function (params) {
            let min = parseInt(params.args[1]),
                max = parseInt(params.args[2] || 0),
                fallback = parseInt(params.fallback);

            if (isNaN(min)) min = fallback;
            if (isNaN(max)) max = fallback;
            if (isNaN(min) || isNaN(max)) return await Builder.errors.notANumber(params);

            if (min > max)
                min = [max, max = min][0];

            return bu.getRandomInt(min, max);
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();