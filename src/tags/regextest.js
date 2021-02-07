/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:51:46
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-10-17 11:59:38
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.AutoTag('regextest')
        .withArgs(a => [a.required('text'), a.required('regex')])
        .withDesc('Tests if the `regex` phrase matches the `text`, and returns a boolean (true/false). ' +
            '`regex` will only succeed to compile if it is deemed a safe regular expression ' +
            '(safe regexes do not run in exponential time for any input) and is less than 2000 characters long.')
        .withExample(
            '{regextest;apple;/p+/i} {regextest;banana;/p+/i}',
            'true false'
        ).resolveArgs(0)
        .whenArgs('0-1', Builder.errors.notEnoughArguments)
        .whenArgs(2, async function (subtag, context, args) {
            let regex;
            try {
                regex = bu.createRegExp(args[1].content);
            } catch (e) {
                return Builder.util.error(subtag, context, e.message);
            }

            return regex.test(args[0]);

        }).whenDefault(Builder.errors.tooManyArguments)
        .withProp('argLimit', 50000)
        .build();
