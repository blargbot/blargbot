/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:25:36
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-10-18 13:08:52
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

var e = module.exports = {};

e.init = () => {
    e.category = bu.TagType.CCOMMAND;
};

e.requireCtx = require;

e.isTag = true;
e.name = `setnick`;
e.args = `&gt;nick&lt; [user]`;
e.usage = `{addrole;nick[;user]}`;
e.desc = `Sets a user's nickname. Leave <code>nick</code> blank to reset their nickname.`;
e.exampleIn = `{setnick;super cool nickname}`;
e.exampleOut = ``;

e.execute = async function (params) {
    for (let i = 1; i < params.args.length; i++) {
        params.args[i] = await bu.processTagInner(params, i);
    }
    var replaceString = '';
    var replaceContent = false;
    if (!params.ccommand) {
        replaceString = await bu.tagProcessError(params, '`Can only use in CCommands`');
    } else {
        if (!params.isStaff) {
            replaceString = await bu.tagProcessError(params, '`Author must be staff`');
        } else if (params.args.length > 1) {
            let member = params.msg.member;
            if (params.args[2]) {
                let user = await bu.getUser(params.msg, params.args[2], true);
                if (user) member = params.msg.guild.members.get(user.id);
            }
            if (member) {
                try {
                    await member.edit({
                        nick: params.args[1]
                    });
                } catch (err) {
                    replaceString = await bu.tagProcessError(params, '`Could not change nickname`');
                }
            } else {
                replaceString = await bu.tagProcessError(params, '`No user found`');
            }
        }
    }

    return {
        terminate: params.terminate,
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};