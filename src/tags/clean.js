/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:30:33
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-04-03 19:39:05
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.AutoTag('clean')
        .withArgs(a => a.require('text'))
        .withDesc('Removes all duplicated whitespace from `text`, meaning a cleaner output.')
        .withExample(
            '{clean;Hello!  \n\n  Im     here    to help}',
            'Hello!\nIm here to help'
        ).resolveArgs(0)
        .whenArgs(0, Builder.errors.notEnoughArguments)
        .whenArgs(1, async function (subtag, context, args) {
            return args[0].replace(/\s+/g, (match) => {
                if (match.indexOf('\n') != -1)
                    return '\n';
                if (match.indexOf('\t') != -1)
                    return '\t';
                return match.substr(0, 1);
            });
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();