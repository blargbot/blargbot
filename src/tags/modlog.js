/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:50:08
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:50:08
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.CCommandTag('modlog')
        .requireStaff()
        .withArgs(a => [
            a.require('action'),
            a.require('user'),
            a.optional('mod'),
            a.optional('reason'),
            a.optional('color')
        ])
        .withDesc('Creates a custom modlog entry for the given `action` and `user`. ' +
            '`color` can be a [HTML color](https://www.w3schools.com/colors/colors_names.asp), hex, (r,g,b) or a valid color number. .')
        .withExample(
            'You did a bad! {modlog;Bad;{userid};;They did a bad;#ffffff}',
            'You did a bad! (modlog entry)'
        ).beforeExecute(Builder.util.processAllSubtags)
        .whenArgs('1-2', Builder.errors.notEnoughArguments)
        .whenArgs('3-6', async function (params) {
            let action = params.args[1],
                user = await bu.getUser(params.msg, params.args[2]),
                mod = params.args[3] || undefined,
                reason = params.args[4] || undefined,
                color = bu.parseColor(params.args[5]) || undefined;

            if (mod != null)
                mod = await bu.getUser(params.msg, mod);

            if (user == null)
                return await Builder.errors.noUserFound(params);
            await bu.logAction(params.msg.guild, user, mod, action, reason, color);
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();