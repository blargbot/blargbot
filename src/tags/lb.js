/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:49:26
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:49:26
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.AutoTag('lb')
        .withDesc('Will be replaced by `{` on execution.')
        .withExample(
            'This is a bracket! {lb}',
            'This is a bracket! {'
        ).beforeExecute(Builder.util.processAllSubtags)
        .whenArgs('1', async function (params) {
            return bu.specialCharBegin + 'LB' + bu.specialCharEnd;
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();