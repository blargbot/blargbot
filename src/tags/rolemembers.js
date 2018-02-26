/*
 * @Author: stupid cat
 * @Date: 2017-05-21 00:22:32
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-28 13:31:31
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

var e = module.exports = {};

e.init = () => {
    e.category = bu.TagType.COMPLEX;
};

e.requireCtx = require;

e.isTag = true;
e.name = 'rolemembers';
e.args = '&lt;role&gt; [quiet]';
e.usage = '{rolemembers;role[;quiet]}';
e.desc = 'Returns an array of members in the specified role. '+
'If `quiet` is specified, if a role can\'t be found it will simply return the `role`';
e.exampleIn = 'The admins are: {rolemembers;Admin}';
e.exampleOut = 'The admins are: ["11111111111111111","22222222222222222"]';


e.execute = async function (params) {
    for (let i = 1; i < params.args.length; i++) {
        params.args[i] = await bu.processTagInner(params, i);
    }
    let args = params.args,
        msg = params.msg;
    var replaceString = '';
    var replaceContent = false;

    let members;
    if (params.args.length > 1) {
        let obtainedRole = await bu.getTagRole(msg, args);
        if (obtainedRole)
            members = params.msg.guild.members.filter(m => m.roles.includes(obtainedRole.id)).map(m => m.user.id);
        else if (params.args[2])
            replaceString = args[1];
        else return '';
    } else {
        replaceString = await bu.tagProcessError(params, '`Not enough arguments`');
    }

    if (members && Array.isArray(members))
        replaceString = JSON.stringify(members);

    return {
        terminate: params.terminate,
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};