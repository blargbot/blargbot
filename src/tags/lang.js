/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:49:20
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:49:20
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.BotTag('lang')
        .withArgs(a => a.require('language'))
        .isDeprecated(true)
        .withDesc('Specifies which `language` should be used when viewing the raw of this tag')
        .withExample(
            'This will be displayed with js! {lang;js}.',
            'This will be displayed with js!.'
        )
        .whenArgs(0, Builder.errors.notEnoughArguments)
        .whenArgs(1, async _ => '')
        .whenDefault(Builder.errors.tooManyArguments)
        .build();