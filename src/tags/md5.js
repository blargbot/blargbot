
/*
 * @Author: byParallax
 * @Date: 2018-08-09 21:15
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');
var md5 = require('md5');

module.exports =
    Builder.AutoTag('md5')
        .withAlias('btoa')
        .withArgs(a => [
            a.require('text')
        ]).withDesc('Converts the provided text to md5.')
        .withExample(
        '{base64encode;Woosh whap phew!}',
        '71d97a11f770a34d7f8cf1f1d8749d85'
        )
        .whenArgs('0', Builder.errors.notEnoughArguments)
        .whenArgs('1', async function (subtag, context, args) {
            let text = args[0];
            let hashed = md5(text);
            return hashed;

        }).whenDefault(Builder.errors.tooManyArguments)
        .build();
