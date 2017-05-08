/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:26:54
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:26:54
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

var e = module.exports = {};

e.init = () => {
    e.category = bu.TagType.CCOMMAND;
};

e.requireCtx = require;

e.isTag = true;
e.name = `ban`;
e.args = `&lt;user&gt; [days to delete] [reason] [time until unban] [noperms]`;
e.usage = `{channel;user[;days to delete[;reason[;time until unban[;noperms]]]]}`;
e.desc = `Bans a user. This functions the same as the ban command. If noperms is provided, do not check if the command executor is actually able to ban people. Only provide this if you know what you're doing.`;
e.exampleIn = `{ban;@user;0;This is a test ban}@user was banned!`;
e.exampleOut = `@user was banned!`;

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
            let user = await bu.getUser(params.msg, params.args[1], true);
            if (user) {
                let noPerms = params.args[5] ? true : false;
                let duration;
                if (params.args[4]) duration = bu.parseDuration(params.args[4]);
                let response = await CommandManager.list['ban'].ban(params.msg, user, params.args[2], params.args[3],
                    duration, true, noPerms);
                logger.debug('Response', response);
                if (typeof response[1] == 'string' && response[1].startsWith('`')) {
                    replaceString = await bu.tagProcessError(params, response[1]);
                } else replaceString = response[1];
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