/*
 * @Author: stupid cat
 * @Date: 2017-05-07 19:19:43
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-05-16 10:15:11
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.APITag('usercreatedat')
        .withArgs(a => [a.optional('format'), a.optional('user'), a.optional('quiet')])
        .withDesc('Returns the date that `user` was created using `format` for the output, in UTC+0. ' +
            '`user` defaults to the user executing the containing tag. `format` defaults to `YYYY-MM-DDTHH:mm:ssZ`. ' +
            'See the [moment documentation](http://momentjs.com/docs/#/displaying/format/) for more information. ' +
            'If `quiet` is specified, if `user` can\'t be found it will simply return nothing.')
        .withExample(
            'Your account was created on {usercreatedat;YYYY/MM/DD HH:mm:ss}',
            'Your account was created on 2016/01/01 01:00:00.'
        )
        .whenArgs('0-3', async function (subtag, context, args) {
            let quiet = bu.isBoolean(context.scope.quiet) ? context.scope.quiet : !!args[2],
                user = context.user;

            if (args[1])
                user = await context.getUser(args[1], {
                    quiet,
                    suppress: context.scope.suppressLookup,
                    label: `${context.isCC ? 'custom command' : 'tag'} \`${context.tagName || 'unknown'}\``
                });

            if (user != null)
                return dep.moment(user.createdAt).utcOffset(0).format(args[0] || '');

            if (quiet)
                return '';
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();