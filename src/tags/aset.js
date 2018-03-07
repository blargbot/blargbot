/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:26:50
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:26:50
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.AutoTag('aset')
        .isDeprecated('set').acceptsArrays()
        .withArgs(a => [a.require('name'), a.optional('value', true)])
        .withDesc('Stores `value` under the variable `name`. ' +
            'Variables are unique per-author.'
        ).withExample(
            '{aset;testvar;This is a test var}',
            ''
        ).beforeExecute(Builder.util.processAllSubtags)
        .whenDefault(async function(params) {
            params.args[1] = '@' + params.args[1];
            return await TagManager.list['set'].execute(params);
        })
        .build();