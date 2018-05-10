/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:27:02
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-05-10 10:22:27
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.AutoTag('base64decode')
        .withAlias('atob')
        .withArgs(a => [
            a.require('base64')
        ]).withDesc('Converts the provided base64 to a UTF-8 string.')
        .withExample(
        '{atob;RmFuY3kh}',
        'Fancy!'
        )
        .whenArgs('0', Builder.errors.notEnoughArguments)
        .whenArgs('1', async function (subtag, context, args) {
            let b64 = args[0];
            let text = Buffer.from(b64, 'base64').toString();
            return text;

        }).whenDefault(Builder.errors.tooManyArguments)
        .build();