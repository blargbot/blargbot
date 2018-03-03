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
        .withDesc('Accepts 1 or more boolean values (`true` or `false`) and returns the result of a logic operation on them. ' +
            'Valid logic operators are `||`, `&&`, `XOR`, `!`.')
        .withExample(
            '{logic;&&;true;false}',
            'false'
        ).beforeExecute(Builder.util.processAllSubtags)
        .whenArgs('1-2', Builder.errors.notEnoughArguments)
        .whenDefault(async function (params) {
            let values = params.args.slice(1),
                operator;

            for (let i = 0; i < values.length; i++) {
                if (this.operators[values[i]]) {
                    operator = this.operators[values[i]];
                    values.splice(i, 1);
                }
            }

            if (operator == null)
                return await Builder.errors.invalidOperator(params);

            values = values.map(bu.parseBoolean);
            if (values.filter(v => !bu.isBoolean(v)).length > 0)
                return await Builder.errors.notABoolean(params);

            return operator(values);
        })
        .withProp('operators', operators)
        .build();