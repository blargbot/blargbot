const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.APITag('userroles')
        .withArgs(a => [a.optional('user'), a.optional('quiet')])
        .withDesc('Returns `user`\'s roles as an array. `user` defaults to the user who executed the containing tag. ' +
            'If `quiet` is specified, if `user` can\'t be found it will simply return nothing.')
        .withExample(
            'Your roles are {userroles}!',
            'Your roles are ["1111111111111111","2222222222222222"]!'
        )
        .whenArgs('0-2', async function (subtag, context, args) {
            let quiet = bu.isBoolean(context.scope.quiet) ? context.scope.quiet : !!args[1],
                user = context.user;

            if (args[0])
                user = await context.getUser(args[0], {
                    quiet, suppress: context.scope.suppressLookup,
                    label: `${context.isCC ? 'custom command' : 'tag'} \`${context.tagName || 'unknown'}\``
                });

            if (user != null) {
                let member = context.guild.members.get(user.id);
                if (member == null) return [];
                return member.roles;
            }

            if (quiet)
                return '';
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();