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
        .withArgs(a => [a.optional('text'), a.require('phrase'), a.require('replacewith')])
        .withDesc('Replaces the `phrase` with `replacewith`. ' +
            'If `text` is specified, the subtag is replaced with the new `toreplace`. ' +
            'If not, it replaces the message that will be sent from this tag.')
        .withExample(
            'I like {replace;to eat;eat;nom} cheese. {replace;cheese;ham}',
            'I like to nom ham. ham'
        ).beforeExecute(Builder.util.processAllSubtags)
        .whenArgs('1-2', Builder.errors.notEnoughArguments)
        .whenArgs('3-4', async function (params) {
            let phrase = params.args[params.args.length - 2],
                replaceWith = params.args[params.args.length - 1];

            if (params.args.length == 4)
                return params.args[1].replace(phrase, replaceWith);

            return {
                replaceString: replaceWith,
                replace: phrase,
                replaceContent: true
            };
        }).whenDefault(Builder.errors.tooManyArguments)
        .build();