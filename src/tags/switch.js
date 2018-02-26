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
    new Builder()
        .withCategory(bu.TagType.COMPLEX)
        .withName('switch')
        .withArgs(b =>
            b.require('value').optional(b =>
                b.require('case', 'then').allowMultiple(true)
            ).optional('default')
        ).withDesc('Finds the `case` that matches `value` and returns the following `then`.' +
            'If there is no matching `case` and `default` is specified,' +
            '`default` is returned. If not, it returns blank.'
        ).withExample(
            '{switch;{args;0};yes;Correct!;no;Incorrect!;That is not yes or no}',
            'Correct!'
        ).beforeExecute(async params => {
            params.args[1] = await bu.processTagInner(params, 1);
            for (let i = 2; i < params.args.length; i += 2) {
                if (i != params.args.length - 1)
                    params.args[i] = await bu.processTagInner(params, i);
            }
        }).whenDefault(async params => {
            let args = params.args;
            var replaceString = '';
            var elseDo = '';
            var cases = {};
            args.shift();
            var arg = args[0];
            args.shift();
            for (let i = 0; i < args.length; i++) {
                if (i != args.length - 1) {
                    let deserialized = bu.deserializeTagArray(args[i]);
                    if (deserialized && Array.isArray(deserialized.v)) {
                        for (let j = 0; j < deserialized.v.length; j++) {
                            cases[deserialized.v[j]] = args[i + 1];
                        }
                    } else {
                        cases[args[i]] = args[i + 1];
                    }
                    i++;
                } else {
                    elseDo = args[i];
                }
            }
            if (args.length % 2 != 0)
                replaceString = cases[arg] || elseDo;
            else
                replaceString = cases[arg] || '';
            params.content = replaceString;
            return await bu.processTagInner(params);
        }).build();