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
        .withArgs(a => [a.require('text'), a.require('regex')])
        .withDesc('Tests if the `regex` phrase matches the `text`, and returns a boolean (true/false).')
        .withExample(
            '{regextest;apple;/p+/i} {regextest;banana;/p+/i}',
            'true false'
        ).whenArgs('1-2', Builder.errors.notEnoughArguments)
        .whenArgs('3', async function (params) {
            let text = await bu.processTagInner(params, 1), regex;

            try {
                regex = bu.createRegExp(params.args[2]);
            } catch (e) {
                console.error(e, params);
                return await Builder.util.error(params, e);
            }

            return regex.test(text);

        }).whenDefault(Builder.errors.tooManyArguments)
        .build();