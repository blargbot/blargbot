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
            '{randstr;abcdefghijklmnopqrstuvwxyz;9}',
            'kgzyqcvda'
        )
        .whenArgs('0-1', Builder.errors.notEnoughArguments)
        .whenArgs(2, async function (subtag, context, args) {
            let chars = args[0].split(''),
                count = bu.parseInt(args[1]),
                fallback = bu.parseInt(context.scope.fallback);

            if (isNaN(count)) count = fallback;
            if (isNaN(count)) return Builder.errors.notANumber(subtag, context);

            if (chars.length == 0) return Builder.util.error(subtag, context, 'Not enough characters');

            return bu.range(count).map(k => chars[bu.getRandomInt(0, chars.length - 1)]).join('');
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();
