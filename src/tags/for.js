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
        .withDesc('To start, `variable` is set to `initial`. Then, the tag will loop, first checking `variable` against `limit` using `comparison`. ' +
            'If the check succeeds, `code` will be run before `variable` being incremented by `increment` and the cycle repeating.\n' +
            'This is very useful for repeating an action (or similar action) a set number of times. Edits to `variable` inside `code` will be ignored')
        .withExample(
            '{for;~index;0;<;10;{get;~index},}',
            '0,1,2,3,4,5,6,7,8,9,'
        ).resolveArgs(0, 1, 2, 3)
        .whenArgs('0-4', Builder.errors.notEnoughArguments)
        .whenArgs('5-6', async function (subtag, context, args) {
            let errors = [],
                varName = args[0],
                initial = bu.parseFloat(args[1]),
                operator = operators[args[2]],
                limit = bu.parseFloat(args[3]),
                code = args.length - 1,
                result = '',
                increment;

            if (args.length == 5)
                increment = 1;
            else
                increment = bu.parseFloat(await this.executeArg(subtag, args[4], context));

            if (isNaN(initial)) errors.push('Initial must be a number');
            if (!operator) errors.push('Invalid operator');
            if (isNaN(limit)) errors.push('Limit must be a number');
            if (isNaN(increment)) errors.push('Increment must be a number');
            if (errors.length > 0) return Builder.util.error(subtag, context, errors.join(', '));

            let remaining = context.state.limits.for || { loops: NaN };

            for (let i = initial; operator(i, limit); i += increment) {
                remaining.loops--;
                if (!(remaining.loops >= 0)) { // (remaining.loops < 0) would not work due to the comparison behaviours of NaN
                    result += Builder.errors.tooManyLoops(subtag, context);
                    break;
                }
                await context.variables.set(varName, i);
                result += await this.executeArg(subtag, args[code], context);
                i = bu.parseFloat(await context.variables.get(varName));
                if (isNaN(i)) {
                    result += Builder.errors.notANumber(subtag, context);
                    break;
                }

                if (context.state.return != 0)
                    break;
            }
            await context.variables.reset(varName);
            return result;
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();
