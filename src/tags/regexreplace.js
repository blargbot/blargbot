/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:51:46
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-04-01 14:46:51
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.AutoTag('regexreplace')
        .withArgs(a => [a.optional('text'), a.require('regex'), a.require('replaceWith')])
        .withDesc('Replaces the `regex` phrase with `replacewith`. ' +
            'If `text` is specified, the tag is replaced with the new `toreplace`. ' +
            'If not, it is run on the output from the containing tag. ' +
            '`regex` will only succeed to compile if it is deemed a safe regular expression ' +
            '(safe regexes do not run in exponential time for any input) and is less than 2000 characters long.')
        .withExample(
            'I like {regexreplace;to consume;/o/gi;a} cheese. {regexreplace;/e/gi;n}',
            'I likn ta cansumn chnnsn.'
        ).resolveArgs(-1)
        .whenArgs('0-1', Builder.errors.notEnoughArguments)
        .whenArgs('2-3', async function (subtag, context, args) {
            let rWith = await this.executeArg(subtag, args[args.length - 1], context),
                regex;
            try {
                regex = bu.createRegExp(args[args.length - 2].content);
            } catch (e) {
                return Builder.util.error(subtag, context, e.message);
            }

            if (args.length == 3)
                return (await this.executeArg(subtag, args[0], context)).replace(regex, rWith);

            context.state.replace = { regex, with: rWith };

        }).whenDefault(Builder.errors.tooManyArguments)
        .withProp('argLimit', 50000)
        .build();
