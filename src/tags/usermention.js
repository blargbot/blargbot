/*
 * @Author: stupid cat
 * @Date: 2017-05-07 19:20:35
 * @Last Modified by: RagingLink
 * @Last Modified time: 2021-07-03 19:13:01
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.APITag('usermention')
        .withArgs(a => [a.optional('user'), a.optional('quiet'), a.optional('noPing')])
        .withDesc('Mentions `user`. `user` defaults to the user who executed the containing tag. ' +
            'If `quiet` is specified (can be any value), if `user` can\'t be found it will simply return nothing. ' +
            'If `noPing` is `true` (must be a boolean), user won\'t be pinged but the mention will still be displayed, if it is `false` the mention will ping.')
        .withExample(
            'Hello, {usermention}!',
            'Hello, @user!'
        )
        .whenArgs('0-3', async function (subtag, context, args) {
            let quiet = bu.isBoolean(context.scope.quiet) ? context.scope.quiet : !!args[1],
                user = context.user;
            const noPing = bu.parseBoolean(args[2]);
            if (args[2] && typeof noPing !== 'boolean') {
                return Builder.errors.notABoolean(subtag, context);
            }
            if (args[0])
                user = await context.getUser(args[0], {
                    quiet, suppress: context.scope.suppressLookup,
                    label: `${context.isCC ? 'custom command' : 'tag'} \`${context.tagName || 'unknown'}\``
                });

            if (user != null) {
                if (!noPing && !context.state.allowedMentions.users.includes(user.id)) {
                    context.state.allowedMentions.users.push(user.id);
                }
                return user.mention;
            }

            if (quiet)
                return '';
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();