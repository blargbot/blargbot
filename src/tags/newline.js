/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:50:14
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:50:14
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.AutoTag('newline')
        .withArgs(a => a.optional('count'))
        .withDesc('Will be replaced by `count` newline characters (\\n).')
        .withExample(
            'Hello,{newline}world!',
            'Hello,\nworld!'
        )
        .whenArgs('0-1', async function (subtag, context, args) {
            let count = bu.parseInt(args[0] || '1'),
                fallback = bu.parseInt(context.scope.fallback);

            if (isNaN(count)) count = fallback;
            if (isNaN(count)) return Builder.errors.notANumber(subtag, context);

            if (count < 0) count = 0;

            return ''.padStart(count, '\n');
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();