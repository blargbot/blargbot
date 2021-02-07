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
        .withArgs(a => [a.required('array'), a.required('text')])
        .withDesc('Joins the elements of `array` together with `text` as the separator.')
        .withExample(
            '{join;["this", "is", "an", "array"];!}',
            'this!is!an!array'
        )
        .whenArgs('0-1', Builder.errors.notEnoughArguments)
        .whenArgs(2, async function (subtag, context, args) {
            let arr = await bu.getArray(context, args[0]),
                text = args[1];

            if (!arr || !Array.isArray(arr.v))
                return Builder.errors.notAnArray(subtag, context);

            return arr.v.join(text);
        }).whenDefault(Builder.errors.tooManyArguments)
        .build();