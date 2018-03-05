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
    Builder.AutoTag('lang')
        .withArgs(a => a.require('language'))
        .withDesc('Specifies the language used to display the raw contents of this tag.')
        .withExample(
            'This will be displayed with js! {lang;js}.',
            'This will be displayed with js!.'
        ).beforeExecute(Builder.util.processAllSubtags)
        .whenArgs('1', Builder.errors.notEnoughArguments)
        .whenArgs('2', async function (params) { })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();