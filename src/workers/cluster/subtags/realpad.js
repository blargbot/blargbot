/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:50:26
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-10-30 12:38:56
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.AutoTag('realpad')
        .withArgs(a => [a.required('text'), a.required('length'), a.optional('filler'), a.optional('direction')])
        .withDesc('Pads `text` using `filler` until it has `length` characters. `filler` is applied to the `direction` of `text` ' +
            '`filler` defaults to space, `direction` defaults to right.\n\n' +
            'This is how padding *should* be implemented, and the {pad} subtag is a sucks. ' +
            'The past me who thought it would be a good idea is also a sucks.')
        .withExample(
            '{realpad;ABC;6;0;left}',
            '000ABC'
        )
        .whenArgs('0-1', Builder.errors.notEnoughArguments)
        .whenArgs('2-4', async function (subtag, context, args) {
            let text = args[0],
                length = bu.parseInt(args[1]),
                filler = args[2] || ' ',
                direction = args[3] || 'right';

            if (isNaN(length))
                return Builder.errors.notANumber(subtag, context);
            if (filler.length != 1)
                return Builder.util.error(subtag, context, 'Filler must be 1 character');

            let padAmount = Math.max(0, length - text.length);

            if (direction.toLowerCase() == 'right')
                return text + filler.repeat(padAmount);
            if (direction.toLowerCase() == 'left')
                return filler.repeat(padAmount) + text;

            return Builder.util.error(subtag, context, 'Invalid direction');

        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();
