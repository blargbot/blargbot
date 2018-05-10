/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:27:02
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-05-09 13:46:34
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.AutoTag('btoa')
        .withArgs(a => [
            a.require('text')
        ]).withDesc('Converts the provided text to base64.')
        .withExample(
        '{btoa;Fancy!}',
        'RmFuY3kh'
        )
        .whenArgs('0', Builder.errors.notEnoughArguments)
        .whenArgs('1', async function (subtag, context, args) {
            let text = args[0];
            let b64 = Buffer.from(text).toString('base64');
            return b64;

        }).whenDefault(Builder.errors.tooManyArguments)
        .build();