/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:27:46
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:27:46
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.AutoTag('capitalize')
        .withArgs(a => [a.require('text'), a.optional('lower')])
        .withDesc('Capitalizes the first letter of `text`. If `lower` is specified the rest of the text will be lowercase')
        .withExample(
            '{capitalize;hello world!}',
            'Hello world!'
        )
        .whenArgs(0, Builder.errors.notEnoughArguments)
        .whenArgs('1-2', async function (subtag, context, args) {
            if (args[0].length == 0) return '';
            if (args[1])
                return args[0][0].toUpperCase() + args[0].substr(1).toLowerCase();
            return args[0][0].toUpperCase() + args[0].substr(1);
        }).whenDefault(Builder.errors.tooManyArguments)
        .build();
