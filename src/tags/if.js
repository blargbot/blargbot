/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:47:48
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-03-29 16:18:00
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder'),
    bbEngine = require('../structures/bbtag/Engine');

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
        ).resolveArgs(-1)
        .whenArgs('0-1', Builder.errors.notEnoughArguments)
        .whenArgs('2-5', async function (subtag, context, args) {
            let val1 = await bbEngine.execute(args[0], context),
                otherwise = args.length % 2 == 1,
                shouldRun;

            switch (args.length) {
                case 2:
                case 3:
                    shouldRun = bu.parseBoolean(val1);
                    if (!bu.isBoolean(shouldRun))
                        return Builder.errors.notABoolean(subtag, context);
                    break;
                case 4:
                case 5:
                    let opKey = await bbEngine.execute(args[1], context);
                    let val2 = await bbEngine.execute(args[2], context);
                    shouldRun = await TagManager.list['bool'].runCondition(subtag, context, val1, opKey, val2);
                    break;
            }

            if (shouldRun)
                return await bbEngine.execute(args[args.length - 1 - otherwise], context);
            else if (otherwise)
                return await bbEngine.execute(args[args.length - 1], context);
            return '';
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();
