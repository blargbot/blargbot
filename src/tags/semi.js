/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:56:57
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:56:57
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.AutoTag('semi')
        .withDesc('Will be replaced by `;` on execution.')
        .withExample(
            'This is a semicolon! {semi}',
            'This is a semicolon! ;'
        ).beforeExecute(Builder.util.processAllSubtags)
        .whenArgs('1', async function (params) {
            return bu.specialCharBegin + 'SEMI' + bu.specialCharEnd;
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();