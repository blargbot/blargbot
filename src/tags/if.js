/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:47:48
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-01-17 19:36:04
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.AutoTag('if')
        .acceptsArrays()
        .withArgs(a => [
            a.require('value1'),
            a.optional([a.require('evaluator'), a.require('value2')]),
            a.require('then'),
            a.optional('else')
        ]).withDesc('If `evaluator` and `value2` are provided, `value1` is evaluated against `value2` using `evaluator`. ' +
            'If they are not provided, `value1` is read as `true` or `false`. ' +
            'If the resulting value is `true` then the tag returns `then`, otherwise it returns `else`.\n' +
            'Valid evaluators are `' + Object.keys(TagManager.list['bool'].operators).join('`, `') + '`.')
        .withExample(
            '{if;5;<=;10;5 is less than or equal to 10;5 is greater than 10}.',
            '5 is less than or equal to 10.'
        ).whenArgs('1-2', Builder.errors.notEnoughArguments)
        .whenArgs('3-6', async function (params) {
            let val1 = await bu.processTagInner(params, 1),
                otherwise = NaN,
                opKey, operator, val2, then;

            switch (params.args.length) {
                case 4:
                    otherwise = 3;
                case 3:
                    let bool = bu.parseBoolean(val1);
                    if (!bu.isBoolean(bool))
                        return await Builder.errors.notABoolean(params);
                    if (bool)
                        return await bu.processTagInner(params, 2);
                    else if (otherwise)
                        return await bu.processTagInner(params, otherwise);
                    return '';
                case 6:
                    otherwise = 5;
                case 5:
                    opKey = await bu.processTagInner(params, 2);
                    val2 = await bu.processTagInner(params, 3);
                    then = 4;
                    break;
            }

            if (await TagManager.list['bool'].runCondition(params, val1, opKey, val2))
                return bu.processTagInner(params, then);
            else if (!isNaN(otherwise))
                return bu.processTagInner(params, otherwise);
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();
