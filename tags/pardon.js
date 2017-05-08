/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:50:33
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:50:33
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

var e = module.exports = {};

e.init = () => {
    e.category = bu.TagType.CCOMMAND;
};

e.requireCtx = require;

e.isTag = true;
e.name = `pardon`;
e.args = `[user] [count] [reason]`;
e.usage = `{pardon[;user[;count[;reason]]]}`;
e.desc = `Gives a user the specified number of pardons with the given reason, and returns their new warning count.`;
e.exampleIn = `Be pardoned! {pardon}`;
e.exampleOut = `Be warned! 0`;

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
        } else {
            let user = params.msg.author;
            if (params.args[1]) {
                user = await bu.getUser(params.msg, params.args[1], true);
            }

            if (user) {
                let count = 1;
                if (params.args[2]) count = parseInt(params.args[2]);
                if (!isNaN(count)) {
                    let reason = params.args[3];
                    let res = await bu.issuePardon(user, params.msg.guild, count);
                    await bu.logAction(params.msg.guild, user, undefined, 'Tag Pardon', reason, bu.ModLogColour.PARDON, [{
                        name: 'Pardons',
                        value: `Assigned: ${count}\nNew Total: ${res || 0}`,
                        inline: true
                    }]);
                    replaceString = res;
                } else {
                    replaceString = await bu.tagProcessError(params, '`Not a number`');
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