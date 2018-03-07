/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:49:14
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-02-06 17:13:34
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.ArrayTag('join')
        .withArgs(a => [a.require('array'), a.require('text')])
        .withDesc('Joins the elements of `array` together with `text` as the separator.')
        .withExample(
            '{join;["this", "is", "an", "array"];!}',
            'this!is!an!array'
        ).beforeExecute(Builder.util.processAllSubtags)
        .whenArgs('1-2', Builder.errors.notEnoughArguments)
        .whenArgs('3', async function (params) {
            let arr = await bu.getArray(params, params.args[1]),
                text = params.args[2];

            if (!arr || !Array.isArray(arr.v))
                return await Builder.errors.notAnArray(params);

            return arr.v.join(text);
        }).whenDefault(Builder.errors.tooManyArguments)
        .build();