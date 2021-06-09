const Builder = require('../structures/TagBuilder');
const moment = require('moment-timezone');

module.exports =
    Builder.APITag('userboostdate')
        .withArgs(a => [a.optional('format'), a.optional('user'), a.optional('quiet')])
        .withDesc('Returns the date that `user` started boosting the current guild using `format` for the output, in UTC+0. ' +
            'If `user` isn\'t boosting this guild return `User not boosting`' +
            '`user` defaults to the user who executed the containing tag. ' +
            '`format` defaults to `YYYY-MM-DDTHH:mm:ssZ`. ' +
            'See the [moment documentation](http://momentjs.com/docs/#/displaying/format/) for more information. ' +
            'If `quiet` is specified, if `user` can\'t be found it will simply return nothing.')
        .withExample(
            'Your account started boosting this guild on {userboostdate;YYYY/MM/DD HH:mm:ss}',
            'Your account started boosting this guild on 2020/02/27 00:00:00'
        )
        .whenArgs('0-3', async function (subtag, context, args) {
            let quiet = bu.isBoolean(context.scope.quiet) ? context.scope.quiet : !!args[2],
                user = context.user;

            if (args[1])
                user = await context.getUser(args[1], {
                    quiet, suppress: context.scope.suppressLookup,
                    label: `${context.isCC ? 'custom command' : 'tag'} \`${context.tagName || 'unknown'}\``
                });
            
            if (user != null) {
                let member = context.guild.members.get(user.id);
                if (member != null) {
                  //Not sure if this needs the error to be in TagBuilder.errors as it's just used once.
                  if(!member.premiumSince) return Builder.errors.customError(subtag, context, 'User not boosting');
                  return moment(member.premiumSince).utcOffset(0).format(args[0] || '');
                }
                return Builder.errors.userNotInGuild(subtag, context);
            }

            if (quiet)
                return '';
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();
