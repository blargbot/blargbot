/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:57:48
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:57:48
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.AutoTag('space')
        .withArgs(a => a.optional('count'))
        .withDesc('Will be replaced by `count` spaces (Default to 1).')
        .withExample(
            'Hello,{space;4}world!',
            'Hello,    world!'
        )
        .whenArgs('0-1', async function (subtag, context, args) {
            let count = bu.parseInt(args[0] || '1'),
                fallback = bu.parseInt(context.scope.fallback);

            if (isNaN(count)) count = fallback;
            if (isNaN(count)) return Builder.errors.notANumber(subtag, context);

            if (count < 0) count = 0;

            return ''.padStart(count, ' ');
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();