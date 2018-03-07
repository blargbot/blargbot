/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:25:45
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:25:45
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.AutoTag('aget')
        .isDeprecated('get')
        .withArgs(a => [a.require('varName'), a.optional('index')])
        .withDesc('Returns the value of `varName`. If `index` is specified and `varName` is stored as an array, ' +
            'then `index` of the array will be returned. ' +
            'Variables are unique per-author.'
        ).withExample(
            '{aget;testvar}',
            'This is a test var'
        ).beforeExecute(Builder.util.processAllSubtags)
        .whenArgs('1', Builder.errors.notEnoughArguments)
        .whenArgs('2-3', async function (params) {
            params.args[1] = '@' + params.args[1];
            return await TagManager.list['get'].execute(params);
        }).whenDefault(Builder.errors.tooManyArguments)
        .build();