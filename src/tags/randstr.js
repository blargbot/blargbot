/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:51:23
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:51:23
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.AutoTag('randstr')
        .withArgs(a => [a.require('chars'), a.require('length')])
        .withDesc('Creates a random string with characters from `chars` that is `length` characters long.')
        .withExample(
            'You rolled a {randint;1;6}.',
            'You rolled a 5.'
        ).beforeExecute(Builder.util.processAllSubtags)
        .whenArgs('1-2', Builder.errors.notEnoughArguments)
        .whenArgs('3', async function (params) {
            let chars = params.args[1].split(''),
                count = parseInt(params.args[2]),
                fallback = parseInt(params.fallback);

            if (isNaN(count)) count = fallback;
            if (isNaN(count)) return await Builder.errors.notANumber(params);

            if (chars.length == 0) return await Builder.util.error(params, 'Not enough characters');

            return bu.range(count).map(k => chars[bu.getRandomInt(0, chars.length - 1)]).join('');
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();