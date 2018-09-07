/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:50:03
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-09-07 11:16:54
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.APITag('json')
        .withAlias('j')
        .withArgs(a => [a.require('input')])
        .withDesc('Defines a raw JSON object without using subtags.')
        .withExample(
        '{json;{\n  "key": "value"\n}}',
        '{\n  "key": "value"\n}'
        ).resolveArgs(-1)
        .whenArgs(0, Builder.errors.notEnoughArguments)
        .whenArgs(1, async function (subtag, context, args) {
            let raw = args[0].content;
            try {
                return JSON.parse(raw);
            } catch (err) {
                return Builder.errors.invalidJSON(subtag, context);
            }
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();