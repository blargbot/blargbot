/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:49:40
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:49:40
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder'),
    operators = {
        '&&': (vals) => vals.length > 0 && vals.filter(v => v).length == vals.length,
        '||': (vals) => vals.filter(v => v).length > 0,
        'xor': (vals) => vals.filter(v => v).length == 1,
        '^': (vals) => operators['xor'](vals),
        '!': (vals) => !vals[0]
    };

module.exports =
    Builder.AutoTag('logic')
        .withArgs(a => [a.require('operator'), a.require('values', true)])
        .withDesc('Accepts 1 or more boolean `values` (`true` or `false`) and returns the result of `operator` on them. ' +
            'Valid logic operators are `' + Object.keys(operators).join('`, `') + '`.')
        .withExample(
            '{logic;&&;true;false}',
            'false'
        )
        .whenArgs('0-1', Builder.errors.notEnoughArguments)
        .whenDefault(async function (subtag, context, args) {
            let operator;

            for (let i = 0; i < args.length; i++) {
                if (this.operators[args[i].toLowerCase()]) {
                    operator = this.operators[args[i].toLowerCase()];
                    args.splice(i, 1);
                }
            }

            if (operator == null)
                return Builder.errors.invalidOperator(subtag, context);

            args = args.map(bu.parseBoolean);
            if (args.filter(v => !bu.isBoolean(v)).length > 0)
                return Builder.errors.notABoolean(subtag, context);

            return operator(args);
        })
        .withProp('operators', operators)
        .build();