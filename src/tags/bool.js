/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:27:16
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-10-12 18:53:46
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

const operators = {
    '==': (a, b) => a === b,
    '!=': (a, b) => a !== b,
    '>=': (a, b) => a >= b,
    '>': (a, b) => a > b,
    '<=': (a, b) => a <= b,
    '<': (a, b) => a < b,
    'startswith': (a, b) => a.toString().startsWith(b),
    'endswith': (a, b) => a.toString().endsWith(b),
    'includes': (a, b) => a.toString().includes(b)
};

module.exports =
    Builder.ComplexTag('bool')
        .withArgs(b =>
            b.require('evaluator')
                .require('arg1')
                .require('arg2')
        ).withDesc('Evaluates `arg1` and `arg2` using the `evaluator` and returns `true` or `false`. ' +
            'Valid evaluators are `' + Object.keys(operators).join('`, `') + '`\n' +
            'The positions of `evaluator` and `arg1` can be swapped.'
        ).withExample(
            '{bool;<=;5;10}',
            'true'
        ).beforeExecute(Builder.util.processAllSubtags)
        .whenArgs('<4', Builder.errors.notEnoughArguments)
        .whenArgs('4', async params => {
            const args = params.args;
            for (var i = 1; i < args.length; i++) {
                let val = parseFloat(args[i]);
                if (!isNaN(val))
                    args[i] = val;
            }

            if (operators.hasOwnProperty(args[1]))
                return operators[args[1]](args[2], args[3]);
            else if (operators.hasOwnProperty(args[2]))
                return operators[args[2]](args[1], args[3]);
            else
                return await Builder.errors.invalidOperator(params);
        }).whenDefault(Builder.errors.tooManyArguments)
        .build();