/*
 * @Author: stupid cat
 * @Date: 2017-05-21 00:22:32
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-07-13 10:50:58
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

var e = module.exports = {};

e.init = () => {
    e.category = bu.TagType.CCOMMAND;
};

e.requireCtx = require;

e.isTag = true;
e.name = `rolesetmentionable`;
e.args = `<name> [value] [quiet]`;
e.usage = `{rolesetmentionable;name[;value]}`;
e.desc = `Sets whether a role can be mentioned. `value` can be either `true` to set the role as mentionable,
 or anything else to set it to unmentionable. If `value` isn't provided, defaults to true. Throws
an error if a role can't be found.`;
e.exampleIn = `The admin role is now mentionable. {rolesetmentionable;admin;true}`;
e.exampleOut = `The admin role is now mentionable.`;

e.execute = async function (params) {
    for (let i = 1; i < params.args.length; i++) {
        params.args[i] = await bu.processTagInner(params, i);
    }
    let args = params.args,
        msg = params.msg;
    var replaceString = '';
    var replaceContent = false;
    if (!params.ccommand) {
        replaceString = await bu.tagProcessError(params, '`Can only use in CCommands`');
    } else {
        if (!params.isStaff) {
            replaceString = await bu.tagProcessError(params, '`Author must be staff`');
        } else if (params.args.length > 1) {
            var obtainedRole = await bu.getTagRole(msg, args);
            let mentionable = true;
            if (params.args[2]) {
                mentionable = params.args[2].toLowerCase() == 'true';
            }

            if (obtainedRole) {
                try {
                    await obtainedRole.edit({ mentionable });
                } catch (err) {
                    replaceString = await bu.tagProcessError(params, '`Failed to edit role: no perms`');
                }
            } else replaceString = await bu.tagProcessError(params, '`Role not found`');
        }
    }
    return {
        terminate: params.terminate,
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};