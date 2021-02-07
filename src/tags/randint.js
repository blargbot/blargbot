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
        .withArgs(a => [a.optional('min'), a.required('max')])
        .withDesc('Chooses a random whole number between `min` and `max` (inclusive). `min` defaults to 0.')
        .withExample(
            'You rolled a {randint;1;6}.',
            'You rolled a 5.'
        )
        .whenArgs(0, Builder.errors.notEnoughArguments)
        .whenArgs('1-2', async function (subtag, context, args) {
            let min = bu.parseInt(args[0]),
                max = bu.parseInt(args[1] || 0),
                fallback = bu.parseInt(context.scope.fallback);

            if (isNaN(min)) min = fallback;
            if (isNaN(max)) max = fallback;
            if (isNaN(min) || isNaN(max)) return Builder.errors.notANumber(subtag, context);

            if (min > max)
                min = [max, max = min][0];

            return bu.getRandomInt(min, max);
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();