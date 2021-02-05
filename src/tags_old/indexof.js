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
            'The index of "o" in "hello world" is {indexof;hello world;o}',
            'The index of "o" in "hello world" is 4'
        )
        .whenArgs('0-1', Builder.errors.notEnoughArguments)
        .whenArgs('2-3', async function (subtag, context, args) {
            let input = await bu.deserializeTagArray(args[0]),
                search = args[1],
                from = bu.parseInt(args[2] || '0'),
                fallback = bu.parseInt(context.scope.fallback);

            if (isNaN(from)) from = fallback;
            if (isNaN(from)) return Builder.errors.notANumber(subtag, context);

            if (input != null && Array.isArray(input.v))
                input = input.v;
            else
                input = args[0];

            return input.indexOf(search, from);
        }).whenDefault(Builder.errors.tooManyArguments)
        .build();