/*
 * @Author: stupid cat
 * @Date: 2017-05-07 19:20:29
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-05-16 10:17:44
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.AutoTag('userjoinedat')
        .withArgs(a => [a.optional('format'), a.optional('user'), a.optional('quiet')])
        .withDesc('Returns the date that `user` joined the current guild using `format` for the output, in UTC+0. ' +
        '`user` defaults to the user who executed the containing tag. ' +
        '`format` defaults to `YYYY-MM-DDTHH:mm:ssZ`. ' +
        'See the [moment documentation](http://momentjs.com/docs/#/displaying/format/) for more information. ' +
        'If `quiet` is specified, if `user` can\'t be found it will simply return nothing.')
        .withExample(
        'Your account joined this guild on {usercreatedat;YYYY/MM/DD HH:mm:ss}',
        'Your account joined this guild on 2016/01/01 01:00:00.'
        )
        .whenArgs('0-3', async function (subtag, context, args) {
            let quiet = bu.isBoolean(context.scope.quiet) ? context.scope.quiet : !!args[2],
                user = context.user;

            if (args[1])
                user = await bu.getUser(context.msg, args[1], {
                    quiet, suppress: context.scope.suppressLookup,
                    label: `${context.isCC ? 'custom command' : 'tag'} \`${context.tagName || 'unknown'}\``
                });

            if (user != null) {
                let member = context.guild.members.get(user.id);
                if (member != null)
                    return dep.moment(member.joinedAt).utcOffset(0).format(args[0] || '');
                return Builder.errors.userNotInGuild(subtag, context);
            }

            if (quiet)
                return '';
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();