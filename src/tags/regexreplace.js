/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:51:46
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-10-17 12:12:28
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.AutoTag('regexreplace')
        .withArgs(a => [a.optional('text'), a.require('regex'), a.require('replaceWith')])
        .withDesc('Replaces the `regex` phrase with `replacewith`. ' +
            'If `text` is specified, the tag is replaced with the new `toreplace`. ' +
            'If not, it is run on the output from the containing tag.')
        .withExample(
            'I like {regexreplace;to consume;/o/gi;a} cheese. {regexreplace;/e/gi;n}',
            'I likn ta cansumn chnnsn.'
        ).whenArgs('1-2', Builder.errors.notEnoughArguments)
        .whenArgs('3-4', async function (subtag, context, args) {
            let regex;
            try {
                regex = bu.createRegExp(params.args[params.args.length - 2]);
            } catch (e) {
                return Builder.util.error(subtag, context, e);
            }

            if (params.args.length == 3)
                return {
                    replace: regex,
                    replaceString: await bu.processTagInner(params, 2),
                    replaceContent: true
                };

            let text = await bu.processTagInner(params, 1),
                replace = await bu.processTagInner(params, 3);

            return text.replace(regex, replace);

        }).whenDefault(Builder.errors.tooManyArguments)
        .build();