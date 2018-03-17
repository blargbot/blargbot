/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:27:16
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-10-12 18:53:46
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder'),
    collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' }),
    operators = {
        '==': (a, b) => a == b,
        '!=': (a, b) => a != b,
        '>=': (a, b) => collator.compare(a, b) >= 0,
        '>': (a, b) => collator.compare(a, b) > 0,
        '<=': (a, b) => collator.compare(a, b) <= 0,
        '<': (a, b) => collator.compare(a, b) < 0,
        'startswith': (a, b) => tryArray(a).startsWith(b),
        'endswith': (a, b) => tryArray(a).endsWith(b),
        'includes': (a, b) => tryArray(a).includes(b)
    };

function tryArray(text) {
    text = '' + text;
    let arr = bu.deserializeTagArray(text);
    if (arr && Array.isArray(arr.v))
        return arr.v;
    return text;
}

module.exports =
    Builder.AutoTag('bool')
        .withArgs(a => [
            a.require('evaluator'),
            a.require('arg1'),
            a.require('arg2')
        ]).withDesc('Evaluates `arg1` and `arg2` using the `evaluator` and returns `true` or `false`. ' +
            'Valid evaluators are `' + Object.keys(operators).join('`, `') + '`\n' +
            'The positions of `evaluator` and `arg1` can be swapped.'
        ).withExample(
            '{bool;<=;5;10}',
            'true'
        ).beforeExecute(Builder.util.processAllSubtags)
        .whenArgs('1-3', Builder.errors.notEnoughArguments)
        .whenArgs('4', async function (params) {
            return this.runCondition(params, ...params.args.splice(1));
        }).whenDefault(Builder.errors.tooManyArguments)
        .withProp("runCondition", async function (params, val1, val2, val3) {
            let opKey, left, right;

            if (this.operators[val2]) {
                left = val1;
                opKey = val2;
                right = val3;
            } else if (this.operators[val1]) {
                opKey = val1;
                left = val2;
                right = val3;
            } else if (this.operators[val3]) {
                left = val1;
                right = val2;
                opKey = val3;
            } else
                return await Builder.errors.invalidOperator(params);

            let leftBool = bu.parseBoolean(left, null, false),
                rightBool = bu.parseBoolean(right, null, false);

            if (bu.isBoolean(leftBool)) left = leftBool;
            if (bu.isBoolean(rightBool)) right = rightBool;

            return this.operators[opKey](left, right);
        })
        .withProp("operators", operators)
        .build();