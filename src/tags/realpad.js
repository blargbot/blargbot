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
        .withArgs(a => [a.require('text'), a.require('length'), a.optional('filler'), a.optional('direction')])
        .withDesc('Pads `text` using `filler` until it has `length` characters. `filler` is applied to the `direction` of `text` ' +
            '`filler` defaults to space, `direction` defaults to right.\n\n' +
            'This is how padding <em>should</em> be implemented, and the {pad} subtag is a sucks. ' +
            'The past me who thought it would be a good idea is also a sucks.')
        .withExample(
            '{realpad;ABC;6;0;left}',
            '000ABC'
        ).beforeExecute(Builder.util.processAllSubtags)
        .whenArgs('1-2', Builder.errors.notEnoughArguments)
        .whenArgs('3-5', async function (params) {
            let text = params.args[1],
                length = parseInt(params.args[2]),
                filler = params.args[3] || ' ',
                direction = params.args[4] || 'right';

            if (isNaN(length))
                return await Builder.errors.notANumber(params);
            if (filler.length != 1)
                return await Builder.util.error(params, 'Filler must be 1 character');

            let padAmount = Math.max(0, length - text.length);

            if (direction.toLowerCase() == 'right')
                return text + filler.repeat(padAmount);
            if (direction.toLowerCase() == 'left')
                return filler.repeat(padAmount) + text;

            return await Builder.util.error(params, 'Invalid direction');

        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();