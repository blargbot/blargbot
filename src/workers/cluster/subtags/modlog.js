/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:50:08
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-05-16 10:19:01
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.BotTag('modlog')
        .withArgs(a => [
            a.required('action'),
            a.required('user'),
            a.optional('mod'),
            a.optional('reason'),
            a.optional('color')
        ])
        .withDesc('Creates a custom modlog entry for the given `action` and `user`. ' +
            '`color` can be a [HTML color](https://www.w3schools.com/colors/colors_names.asp), hex, (r,g,b) or a valid color number. .')
        .withExample(
            'You did a bad! {modlog;Bad;{userid};;They did a bad;#ffffff}',
            'You did a bad! (modlog entry)'
        )
        .whenArgs('1-2', Builder.errors.notEnoughArguments)
        .whenArgs('3-6', async function (subtag, context, args) {
            let action = args[0];
            let user = await context.getUser(args[1], {
                suppress: context.scope.suppressLookup,
                label: `${context.isCC ? 'custom command' : 'tag'} \`${context.tagName || 'unknown'}\``
            });
            let mod = args[2] || undefined;
            let reason = args[3] || undefined;
            let color = bu.parseColor(args[4]) || undefined;

            if (mod != null)
                mod = await context.getUser(mod, {
                    suppress: context.scope.suppressLookup,
                    label: `${context.isCC ? 'custom command' : 'tag'} \`${context.tagName || 'unknown'}\``
                });

            if (user == null)
                return Builder.errors.noUserFound(subtag, context);
            await bu.logAction(context.guild, user, mod, action, reason, color);
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();
