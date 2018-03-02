/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:27:16
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-10-12 18:53:46
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.AutoTag('bool')
        .withArgs(a => [
            a.require('evaluator'),
            a.require('arg1'),
            a.require('arg2')
        ]).withDesc('Evaluates `arg1` and `arg2` using the `evaluator` and returns `true` or `false`. ' +
            'Valid evaluators are `' + /*Object.keys(TagManager.list['if'].operators).join('`, `') +*/ '`\n' +
            'The positions of `evaluator` and `arg1` can be swapped.'
        ).withExample(
            '{bool;<=;5;10}',
            'true'
        ).beforeExecute(Builder.util.processAllSubtags)
        .whenArgs('<4', Builder.errors.notEnoughArguments)
        .whenArgs('4', async function (params) {
            return await TagManager.list['if'].runCondition(params, ...params.args.splice(1));
        }).whenDefault(Builder.errors.tooManyArguments)
        .build();