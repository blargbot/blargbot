/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:47:48
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-01-17 19:36:04
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder'),
    operators = {
        '==': (a, b) => a.toString() === b.toString(),
        '!=': (a, b) => !operators['=='](a, b),
        '>=': (a, b) => a >= b,
        '>': (a, b) => a > b,
        '<=': (a, b) => a <= b,
        '<': (a, b) => a < b,
        'startswith': (a, b) => Array.isArray(a) ? a[0] == b.toString() : a.toString().startsWith(b),
        'endswith': (a, b) => Array.isArray(a) ? a[a.length - 1] == b.toString() : a.toString().endsWith(b),
        'includes': (a, b) => Array.isArray(a) ? a.includes(b.toString()) : a.toString().includes(b)
    };

module.exports =
    Builder.AutoTag('if')
        .withArgs(a => [
            a.require('value1'),
            a.optional([a.require('evaluator'), a.require('value2')]),
            a.require('then'),
            a.optional('else')
        ]).withDesc('If `evaluator` and `value2` are provided, `value` is evaluated against `value2` using `evaluator`. ' +
            'If they are not provided, `value1` is read as `true` or `false`. ' +
            'If the resulting value is `true` then the tag returns `then`, otherwise it returns `else`.\n' +
            'Valid evaluators are `' + Object.keys(operators).join('`, `') + '`.')
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
                    opKey = '==';
                    val2 = 'true';
                    then = 2;
                    break;
                case 6:
                    otherwise = 5;
                case 5:
                    opKey = await bu.processTagInner(params, 2);
                    val2 = await bu.processTagInner(params, 3);
                    then = 4;
                    break;
            }

            if (await this.runCondition(params, val1, opKey, val2))
                return bu.processTagInner(params, then);
            else if (!isNaN(otherwise))
                return bu.processTagInner(params, otherwise);
            return '';
        })
        .whenDefault(Builder.errors.tooManyArguments)
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

            if (!isNaN(parseInt(left))) left = parseInt(left);
            if (!isNaN(parseInt(right))) right = parseInt(right);

            let leftArr = await bu.deserializeTagArray(left),
                rightArr = await bu.deserializeTagArray(right);

            if (leftArr && Array.isArray(leftArr.v)) left = leftArr.v.map(v => '' + v);
            if (rightArr && Array.isArray(rightArr.v)) right = rightArr.v.map(v => '' + v);

            let leftBool = bu.parseBoolean(left),
                rightBool = bu.parseBoolean(right);

            if (bu.isBoolean(leftBool)) left = leftBool;
            if (bu.isBoolean(rightBool)) right = rightBool;

            return this.operators[opKey](left, right);
        })
        .withProp("operators", operators)
        .build();
