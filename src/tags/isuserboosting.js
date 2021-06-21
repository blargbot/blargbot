const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.APITag('isuserboosting')
        .withArgs(a => [a.optional('user'), a.optional('quiet')])
        .withDesc('Returns `true`  is boosting the guild and `false` if not' +
            '`user` defaults to the user who executed the containing tag. ' +
            'If `quiet` is specified, if `user` can\'t be found it will simply return nothing.')
        .withExample(
            '{if;{isuserboosting;stupid cat};stupid cat is boosting!; no boosting here :(}',
            'stupid cat is boosting!'
        ).whenArgs(0, (_, context) => {
            return !!context.member.premiumSince;
        })
        .whenArgs('1-2', async function (subtag, context, args) {
            let quiet = bu.isBoolean(context.scope.quiet) ? context.scope.quiet : !!args[1],
                user = context.user;

            if (args[0])
                user = await context.getUser(args[0], {
                    quiet, suppress: context.scope.suppressLookup,
                    label: `${context.isCC ? 'custom command' : 'tag'} \`${context.tagName || 'unknown'}\``
                });

            if (user != null) {
                let member = context.guild.members.get(user.id);
                if (member != null) return !!member.premiumSince;
                return Builder.errors.userNotInGuild(subtag, context);
            }

            if (quiet)
                return '';
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();
