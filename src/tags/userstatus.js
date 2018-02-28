/*
 * @Author: stupid cat
 * @Date: 2017-05-07 19:20:55
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 19:20:55
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.ComplexTag('userstatus')
        .withArgs(a => [a.optional('user'), a.optional('quiet')])
        .withDesc('Returns the status of the specified user (`online`, `idle`, `dnd`, or `offline`). '+
        'If `user` is specified, gets that user instead. '+
        'If `quiet` is specified, if a user can\'t be found it will simply return the `user`')
        .withExample(
            'You are currently {userstatus}',
            'You are currently online'
        ).beforeExecute(Builder.util.processAllSubtags)
        .whenArgs('1-3', async function (params) {
            let user = await bu.getTagUser(params.msg, params.args, 1);
            if (user != null) {
                let member = params.msg.channel.guild.members.get(user.id);
                if (member != null)
                    return member.status;
            }

            if (params.args[2])
                return params.args[1];
            return '';
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();