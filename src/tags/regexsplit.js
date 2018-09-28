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
    Builder.AutoTag('regexsplit')
        .withArgs(a => [a.require('text'), a.require('regex')])
        .withDesc('Splits the given text using the given `regex` as the split rule. ' +
            '`regex` will only succeed to compile if it is deemed a safe regular expression ' +
            '(safe regexes do not run in exponential time for any input) and is less than 2000 characters long.')
        .withExample(
            '{regexsplit;Hello      there, I       am hungry;/[\\s,]+/}',
            '["Hello","there","I","am","hungry"]'
        ).resolveArgs(0)
        .whenArgs('0-1', Builder.errors.notEnoughArguments)
        .whenArgs(2, async function (subtag, context, args) {
            let regex;
            try {
                regex = bu.createRegExp(args[1].content);
            } catch (e) {
                return Builder.util.error(subtag, context, e.message);
            }

            return JSON.stringify(args[0].split(regex));
        }).whenDefault(Builder.errors.tooManyArguments)
        .withProp('argLimit', 50000)
        .build();
