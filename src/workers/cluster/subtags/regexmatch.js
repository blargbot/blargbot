/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:49:46
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:49:46
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.ArrayTag('regexmatch')
        .withAlias('match')
        .withArgs(a => [a.required('text'), a.required('regex')])
        .withDesc('Returns an array of everything in `text` that matches `regex`. ' +
            '`regex` will only succeed to compile if it is deemed a safe regular expression ' +
            '(safe regexes do not run in exponential time for any input) and is less than 2000 characters long.')
        .withExample(
            '{regexmatch;I have $1 and 25 cents;/\\d+/g}',
            '["1", "25"]'
        ).resolveArgs(0)
        .whenArgs('0-1', Builder.errors.notEnoughArguments)
        .whenArgs(2, async function (subtag, context, args) {
            let text = args[0];
            let regex;

            try {
                regex = bu.createRegExp(args[1].content);
            } catch (e) {
                return Builder.util.error(subtag, context, e.message);
            }

            return bu.serializeTagArray(text.match(regex) || []);
        }).whenDefault(Builder.errors.tooManyArguments)
        .withProp('argLimit', 50000)
        .build();
