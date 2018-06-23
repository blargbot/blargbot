/*
 * @Author: stupid cat
 * @Date: 2017-05-07 19:05:28
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-02-06 17:09:54
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.AutoTag('switch')
        .acceptsArrays()
        .withArgs(a => [
            a.require('value'),
            a.optional([
                a.require('case'),
                a.require('then')
            ], true),
            a.optional('default')
        ])
        .withDesc('Finds the `case` that matches `value` and returns the following `then`. ' +
            'If a `case` value is an array, it will be expanded and matching will be done against its elements. ' +
            'If there is no matching `case` and `default` is specified, ' +
            '`default` is returned. If not, it returns blank.'
        ).withExample(
            '{switch;{args;0};\n  ["yes","definitely"]; {//;Match "yes" OR "definitely"}\n    Correct!;\n  no;\n    Incorrect!;\n  That is not yes or no\n}',
            'yes',
            'Correct!'
        ).resolveArgs(0)
        .whenArgs(0, Builder.errors.notEnoughArguments)
        .whenDefault(async function (subtag, context, args) {
            let value = args[0],
                indexes = [...args.keys()].slice(1).reverse(),
                cases = {},
                elseDo = -1;

            if (indexes.length % 2 == 1) elseDo = indexes.shift();

            for (let i = 0; i < indexes.length; i += 2) {
                let caseValue = await this.executeArg(subtag, args[indexes[i + 1]], context);
                for (const key of Builder.util.flattenArgArrays([caseValue]))
                    cases[key] = indexes[i];
            }

            let result = cases[value] || elseDo;
            if (result != -1)
                return await this.executeArg(subtag, args[result], context);
        }).build();