/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:25:36
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-10-18 13:08:52
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.CCommandTag('setnick')
        .requireStaff()
        .withArgs(a => [a.require('nick'), a.optional('user')])
        .withDesc('Sets `user`\'s nickname to `nick`. Leave `nick` blank to reset their nickname.')
        .withExample(
            '{setnick;super cool nickname}',
            ''
        )
        .whenArgs('0', Builder.errors.notEnoughArguments)
        .whenArgs('1-2', async function (subtag, context, args) {
            let nick = args[0],
                user = context.user;

            if (args[1])
                user = await bu.getUser(context.msg, args[1], false);

            if (user == null) return Builder.errors.noUserFound(subtag, context);
            else user = context.guild.members.get(user.id);

            try {
                await user.edit({
                    nick: nick
                });
            } catch (err) {
                return Builder.util.error(subtag, context, 'Could not change nickname');
            }
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();