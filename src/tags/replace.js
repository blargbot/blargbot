/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:54:15
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:54:15
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.AutoTag('replace')
        .withArgs(a => [a.optional('text'), a.required('phrase'), a.required('replacewith')])
        .withDesc('Replaces the first occurrence of `phrase` with `replacewith`. ' +
            'If `text` is specified, the subtag is replaced with the new `toreplace`. ' +
            'If not, it replaces the message that will be sent from this tag.')
        .withExample(
            'I like {replace;to eat;eat;nom} cheese. {replace;cheese;ham}',
            'I like to nom ham. ham'
        )
        .whenArgs('0-1', Builder.errors.notEnoughArguments)
        .whenArgs('2-3', async function (subtag, context, args) {
            let phrase = args[args.length - 2],
                replaceWith = args[args.length - 1];

            if (args.length == 3)
                return args[0].replace(phrase, replaceWith);

            context.state.replace = {
                regex: phrase,
                with: replaceWith
            };
        }).whenDefault(Builder.errors.tooManyArguments)
        .build();