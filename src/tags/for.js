/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:54:06
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-02-06 17:09:02
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder'),
    operators = {
        '==': (a, b) => a === b,
        '!=': (a, b) => a !== b,
        '>=': (a, b) => a >= b,
        '>': (a, b) => a > b,
        '<=': (a, b) => a <= b,
        '<': (a, b) => a < b
    };

module.exports =
    Builder.AutoTag('for')
        .withArgs(a => [
            a.require('variable'),
            a.require('initial'),
            a.require('comparison'),
            a.require('limit'),
            a.optional('increment'),
            a.require('code')
        ])
        .withDesc('This will increase the value of `variable` by `increment` (defaults to +1), starting at `initial`.')
        .withExample(
            '{for;~index;0;<;10;{get;~index},}',
            '0,1,2,3,4,5,6,7,8,9,'
        ).whenArgs('<6', Builder.errors.notEnoughArguments)
        .whenArgs('6-7', async function (params) {
            let errors = [],
                set = TagManager.list['set'],
                varName = await bu.processTagInner(params, 1),
                initial = parseFloat(await bu.processTagInner(params, 2)),
                operator = operators[await bu.processTagInner(params, 3)],
                limit = parseFloat(await bu.processTagInner(params, 4)),
                code = params.args.length - 1,
                result = '',
                increment;

            if (params.args.length == 6)
                increment = 1;
            else
                increment = parseFloat(await bu.processTagInner(params, 5));

            if (isNaN(initial)) errors.push('Initial must be a number');
            if (!operator) errors.push('Invalid operator');
            if (isNaN(limit)) errors.push('Limit must be a number');
            if (isNaN(increment)) errors.push('Increment must be a number');
            if (errors.length > 0) return await Builder.util.error(params, errors.join(', '));

            for (let i = initial; operator(i, limit); i += increment) {
                params.msg.repeats = params.msg.repeats ? params.msg.repeats + 1 : 1;
                if (params.msg.repeats > 1500) {
                    result += await Builder.errors.tooManyLoops(params);
                    break;
                }
                await set.setVar(params, varName, i);
                result += await bu.processTagInner(params, code);
                if (params.terminate)
                    break;
            }
            return result;
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();