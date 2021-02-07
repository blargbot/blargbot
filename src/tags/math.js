/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:49:55
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:49:55
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

const operators = {
    '+': (a, b) => a + b,
    '-': (a, b) => a - b,
    '*': (a, b) => a * b,
    '/': (a, b) => a / b,
    '%': (a, b) => a % b,
    '^': (a, b) => Math.pow(a, b)
};

const aliases = {
    'x': '*',
    '×': '*',
    ':': '/',
    '÷': '/'
};

module.exports =
    Builder.AutoTag('math')
        .acceptsArrays()
        .withArgs(a => [a.required('operator'), a.required('values', true)])
        .withDesc('Accepts multiple `values` and returns the result of `operator` on them. ' +
            'Valid operators are `' + Object.keys(operators).join('`, `') + '`')
        .withExample(
            '2 + 3 + 6 - 2 = {math;-;{math;+;2;3;6};2}',
            '2 + 3 + 6 - 2 = 9'
        )
        .whenArgs('0-1', Builder.errors.notEnoughArguments)
        .whenDefault(async function (subtag, context, args) {
            if (!operators.hasOwnProperty(args[0]))
                return Builder.errors.invalidOperator(subtag, context);

            let operator = operators[args[0]] || operators[aliases[args[0]]];
            let values = Builder.util.flattenArgArrays(args.slice(1));
            values = values.map(bu.parseFloat);

            if (values.filter(isNaN).length > 0)
                return Builder.errors.notANumber(subtag, context);

            return values.reduce(operator);
        })
        .build();