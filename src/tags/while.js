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
    Builder.AutoTag('while')
        .acceptsArrays()
        .withArgs(a => [
            a.require('value1'),
            a.optional([a.require('evaluator'), a.require('value2')]),
            a.require('code')
        ]).withDesc('This will continuously execute `code` for as long as the condition returns `true`. The condition is as follows:\n' +
            'If `evaluator` and `value2` are provided, `value1` is evaluated against `value2` using `evaluator`. ' +
            'If they are not provided, `value1` is read as `true` or `false`. ' +
            'Valid evaluators are `' + Object.keys(TagManager.list['bool'].operators).join('`, `') + '`.')
        .withExample(
            '{set;~x;0}\n{while;{get;~x};<=;10;{increment;~x},}.',
            '1,2,3,4,5,6,7,8,9,10,11,'
        ).resolveArgs(-1)
        .whenArgs('0,1,3', Builder.errors.notEnoughArguments)
        .whenArgs('2,4', async function (subtag, context, args) {
            let val1Raw, operatorRaw, val2Raw, code,
                val1, operator, val2,
                bool = TagManager.list['bool'],
                loopLimit = true,
                result = '';

            val1Raw = args.shift();

            if (args.length == 1) {
                operatorRaw = bbEngine.parse('==').bbtag;
                val2Raw = bbEngine.parse('true').bbtag;
            } else {
                operatorRaw = args.shift();
                val2Raw = args.shift();
            }

            code = args.shift();

            while (context.state.count.loop <= 1500) {
                context.state.count.loop += 1;

                val1 = await bbEngine.execute(val1Raw, context);
                val2 = await bbEngine.execute(val2Raw, context);
                operator = await bbEngine.execute(operatorRaw, context);

                if (!bool.runCondition(subtag, context, val1, operator, val2)) {
                    loopLimit = false;
                    break;
                }

                result += await bbEngine.execute(code, context);
            }

            if (loopLimit)
                result += Builder.errors.tooManyLoops(subtag, context);

            return result;
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();
