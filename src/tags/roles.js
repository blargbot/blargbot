/*
 * @Author: stupid cat
 * @Date: 2017-05-21 00:22:32
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-21 00:44:23
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

var e = module.exports = {};

e.init = () => {
    e.category = bu.TagType.COMPLEX;
};

e.requireCtx = require;

e.isTag = true;
e.name = `roles`;
e.args = `[user] [quiet]`;
e.usage = `{userid[;user[;quiet]]}`;
e.desc = `Returns an array of roles on the current guild. If user is specified, get the roles that user has. If
<code>quiet</code> is specified, if a user can't be found it will simply return the <code>name</code>`;
e.exampleIn = `The roles on this guild are: {roles}`;
e.exampleOut = `The roles on this guild are: ["11111111111111111","22222222222222222"]`;


e.execute = async function (params) {
    for (let i = 1; i < params.args.length; i++) {
        params.args[i] = await bu.processTagInner(params, i);
    }
    let args = params.args,
        msg = params.msg;
    var replaceString = '';
    var replaceContent = false;

    let roles;
    if (params.args.length > 1) {
        var obtainedUser = await bu.getTagUser(msg, args);
        if (obtainedUser)
            roles = params.msg.guild.members.get(obtainedUser.id).roles;
        else if (params.args[2])
            replaceString = args[1];
        else return '';
    } else {
        roles = params.msg.guild.roles.map(r => r.id);
    }

    if (roles && Array.isArray(roles))
        replaceString = JSON.stringify(roles);

    return {
        terminate: params.terminate,
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};