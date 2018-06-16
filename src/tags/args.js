/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:26:17
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-21 00:49:16
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.AutoTag('args')
        .withArgs(a => [a.optional('index'), a.optional('range')])
        .withDesc('Gets user input. Specifying `index` will only get the word at that location, specifying' +
            '`range` will get all the words between `index` and `range`. Specify `range` as `n` to get all' +
            'the words from `index` to the end'
        ).withExample(
            'Your second word was {args;1}',
            'Hello world!',
            'Your second word was world!'
        )
        .whenArgs(0, async (_, context) => context.input.join(' '))
        .whenArgs('1-2', async function (subtag, context, args) {
            return await this.getArgs(subtag, context, args, context.input);
        })
        .withProp('getArgs', async function (subtag, context, args, values) {
            let from = bu.parseInt(args[0]),
                to = args[1];

            if (!to)
                to = from + 1;
            else if (to === 'n')
                to = values.length;
            else
                to = bu.parseInt(to);

            if (isNaN(from) || isNaN(to))
                return Builder.errors.notANumber(subtag, context);

            if (from > to)
                from = [to, to = from][0];

            if (!values.hasOwnProperty(from))
                return Builder.errors.notEnoughArguments(subtag, context);

            return values.slice(from, to).join(' ');
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();