/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:48:14
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:48:14
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.AutoTag('indexof')
        .acceptsArrays()
        .withArgs(a => [a.require('text'), a.require('searchfor'), a.optional('start')])
        .withDesc('Finds the index of `searchfor` in `text`, after `start`. `text` can either be plain text or an array. If it\'s not found, returns -1.')
        .withExample(
            'The index of \'o\' in \'hello world\' is {indexof;hello world;o}',
            'The index of \'o\' in \'hello world\' is 4'
        ).beforeExecute(Builder.util.processAllSubtags)
        .whenArgs('1-2', Builder.errors.notEnoughArguments)
        .whenArgs('3-4', async function (params) {
            let input = await bu.deserializeTagArray(params.args[1]),
                search = params.args[2],
                from = parseInt(params.args[3] || '0'),
                fallback = parseInt(params.fallback);

            if (isNaN(from)) from = fallback;
            if (isNaN(from)) return await Builder.errors.notANumber(params);

            if (input != null && Array.isArray(input.v))
                input = input.v;
            else
                input = params.args[1];

            return input.indexOf(search, from);
        }).whenDefault(Builder.errors.tooManyArguments)
        .build();