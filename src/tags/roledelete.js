/*
 * @Author: stupid cat
 * @Date: 2017-05-21 00:22:32
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-11-01 09:52:35
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

var e = module.exports = {};

e.init = () => {
    e.category = bu.TagType.CCOMMAND;
};

e.requireCtx = require;

e.isTag = true;
e.name = `roledelete`;
e.args = `&lt;name&gt;`;
e.usage = `{roledelete;name}`;
e.desc = `Deletes a role.`;
e.exampleIn = `{roledelete;Super Cool Role!}`;
e.exampleOut = `(rip no more super cool roles for anyone)`;

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
            if (obtainedRole)
                try {
                    await obtainedRole.delete(`Deleted with the '${params.tagName}' command, executed by ${msg.author.username}#${msg.author.discrim} (${msg.author.id})`);
                } catch (err) {
                    logger.error(err.stack);
                    replaceString = await bu.tagProcessError(params, '`Failed to create role: no perms`');
                }
        }
    }
    return {
        terminate: params.terminate,
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};